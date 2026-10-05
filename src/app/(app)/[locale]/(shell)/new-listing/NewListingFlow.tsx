"use client";

import AnchorRightIcon from "@assets/icons/anchor-right-icon.svg";
import Button from "@/components/genericComponents/Button";
import { Spinner } from "@/components/genericComponents/EmptyState";
import { LoanCalculator } from "@/components/loanCalculator/LoanCalculator";
import { ListingDetailsForm } from "@/components/newListing/ListingDetailsForm";
import { ListingMediaStep } from "@/components/newListing/ListingMediaStep";
import { useToast } from "@/components/providers/ToastProvider";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { queryKeys } from "@/lib/queryKeys";
import {
  createListing,
  createListingMedia,
  deleteListingById,
  fetchListingById,
  updateListing,
  uploadPhotoToStorage,
  uploadVideoToStorage,
} from "@/services/listings";
import type { CreateListingInput, Listing, NewListingDraft } from "@/types/types";
import { containsObjectionableContent } from "@/utils/contentFilter";
import { IMAGE_PRESETS, optimizeImage, optimizeVideo, type OptimizedMedia } from "@/utils/mediaOptimizer";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

// Keep in sync with the listing-videos bucket limit (20260530 migration) and
// MAX_VIDEO_BYTES in the app.
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;
// Photos are re-encoded in the browser; a few at a time keeps a 15-photo
// listing from freezing the tab, and uploads overlap with encoding.
const PHOTO_CONCURRENCY = 3;

const initialDraft: NewListingDraft = {
  category: "apartments",
  listingType: "forRent",
  state: "",
  city: "",
  municipality: "",
  street: "",
  streetNumber: "",
  surfaceM2: "",
  rooms: "",
  orientation: null,
  priceEur: "",
  totalPriceEur: "",
  parking: null,
  constructionType: null,
  propertyCondition: null,
  storey: null,
  storeyFloorNumber: "",
  heatingTypes: [],
  groundType: null,
  groundOther: "",
  furniture: null,
  nearbyObjects: [],
  additionalFeatures: [],
  description: "",
  mediaMode: null,
  photos: [],
  video: null,
};

const toDraftText = (value: number | string | null | undefined) => (value == null ? "" : String(value));

// Media is not editable after publishing (same as the app), so an edit only
// ever touches these columns.
const draftFromListing = (listing: Listing): NewListingDraft => ({
  ...initialDraft,
  category: listing.category ?? initialDraft.category,
  listingType: listing.listing_type ?? initialDraft.listingType,
  state: listing.state ?? "",
  city: listing.city ?? "",
  municipality: listing.municipality ?? "",
  street: listing.street ?? "",
  streetNumber: toDraftText(listing.street_number),
  surfaceM2: toDraftText(listing.surface_m2),
  rooms: toDraftText(listing.rooms),
  orientation: listing.orientation,
  priceEur: toDraftText(listing.price_eur),
  totalPriceEur: toDraftText(listing.total_price_eur),
  parking: listing.parking,
  constructionType: listing.construction_type,
  propertyCondition: listing.property_condition,
  storey: listing.storey,
  storeyFloorNumber: toDraftText(listing.storey_floor_number),
  heatingTypes: listing.heating_types ?? [],
  groundType: listing.ground_type,
  groundOther: listing.ground_other ?? "",
  furniture: listing.furniture,
  nearbyObjects: listing.nearby_objects ?? [],
  additionalFeatures: listing.additional_features ?? [],
  description: listing.description ?? "",
});

/** The column values shared by create and edit, from the validated draft. */
const columnsFromDraft = (draft: NewListingDraft) => ({
  category: draft.category,
  listing_type: draft.listingType,
  state: draft.state.trim(),
  city: draft.city.trim(),
  municipality: draft.municipality.trim(),
  street: draft.street.trim(),
  street_number: draft.streetNumber.trim().length > 0 ? Number(draft.streetNumber) : null,
  surface_m2: Number(draft.surfaceM2),
  rooms: draft.rooms.trim().length > 0 ? Number(draft.rooms) : null,
  orientation: draft.orientation,
  price_eur: Number(draft.priceEur),
  // Null for a rental, and for a sale left empty (the card computes it).
  total_price_eur:
    draft.listingType === "forSale" && draft.totalPriceEur.trim().length > 0
      ? Number(draft.totalPriceEur)
      : null,
  parking: draft.parking,
  construction_type: draft.constructionType,
  property_condition: draft.propertyCondition,
  storey: draft.storey,
  storey_floor_number: draft.storey === "floor" ? Number(draft.storeyFloorNumber) : null,
  heating_types: draft.heatingTypes,
  ground_type: draft.groundType,
  ground_other: draft.groundType === "other" ? draft.groundOther.trim() : null,
  furniture: draft.furniture,
  nearby_objects: draft.nearbyObjects,
  additional_features: draft.additionalFeatures,
  description: draft.description.trim() || null,
});

const bytesOf = async (uri: string) => {
  const blob = await (await fetch(uri)).blob();
  return { bytes: new Uint8Array(await blob.arrayBuffer()), size: blob.size };
};

/** Runs `task` over `items` with at most `limit` in flight, keeping order. */
async function mapWithConcurrency<T, R>(items: T[], limit: number, task: (item: T, index: number) => Promise<R>) {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await task(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

type Progress = { phase: "video"; percent: number } | { phase: "upload"; done: number; total: number } | null;

/**
 * Create / edit a listing — web port of flatswipe/src/app/(protected)/(tabs)/
 * newListing.tsx: same validation, same upload order and the same rollback
 * (the listing row is deleted if any media fails, so nobody ends up with a
 * listing missing its photos). Buyers get the loan calculator here instead,
 * like the app's tab.
 */
export function NewListingFlow() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const editListingId = searchParams.get("editListingId");
  const isEditing = !!editListingId;
  const { currentUser, sessionUser, isLoadingProfile } = useCurrentUser();
  const [step, setStep] = useState<1 | 2>(1);
  const [draft, setDraft] = useState<NewListingDraft>(initialDraft);
  const [progress, setProgress] = useState<Progress>(null);
  const isDirtyRef = useRef(false);
  const hasPrefilledRef = useRef(false);

  const editListingQuery = useQuery({
    queryKey: queryKeys.listing(editListingId ?? "new"),
    queryFn: () => fetchListingById(editListingId!),
    enabled: isEditing,
  });
  const editedListing = editListingQuery.data ?? null;

  useEffect(() => {
    if (!isEditing || !editedListing || hasPrefilledRef.current) return;
    hasPrefilledRef.current = true;
    setDraft(draftFromListing(editedListing));
  }, [isEditing, editedListing]);

  // Leaving with unsaved work asks first — the web's back button and closed
  // tabs are much easier to hit than the app's.
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!isDirtyRef.current) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  const updateDraft = <Key extends keyof NewListingDraft>(key: Key, value: NewListingDraft[Key]) => {
    isDirtyRef.current = true;
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const validateStepOne = () => {
    if (!draft.state.trim()) return t("newListing.stateRequired");
    if (!draft.city.trim()) return t("newListing.cityRequired");
    if (!draft.municipality.trim()) return t("newListing.municipalityRequired");
    if (!draft.street.trim()) return t("newListing.streetRequired");
    if (!draft.surfaceM2.trim()) return t("newListing.surfaceRequired");
    if (!draft.priceEur.trim()) return t("newListing.priceRequired");
    if (draft.storey === "floor" && !draft.storeyFloorNumber.trim()) return t("newListing.storeyFloorNumberRequired");
    if (draft.groundType === "other" && !draft.groundOther.trim()) return t("newListing.groundOtherRequired");

    const streetNumberText = draft.streetNumber.trim();
    const streetNumber = streetNumberText.length > 0 ? Number(streetNumberText) : null;
    if (streetNumber != null && (!Number.isInteger(streetNumber) || streetNumber <= 0)) {
      return t("newListing.invalidStreetNumber");
    }
    const surface = Number(draft.surfaceM2);
    if (!Number.isFinite(surface) || surface <= 0) return t("newListing.invalidSurface");
    const price = Number(draft.priceEur);
    if (!Number.isFinite(price) || price <= 0) return t("newListing.invalidPrice");

    const totalText = draft.totalPriceEur.trim();
    if (draft.listingType === "forSale" && totalText.length > 0) {
      const total = Number(totalText);
      if (!Number.isSafeInteger(total) || total <= 0) return t("newListing.invalidTotalPrice");
    }

    // Optional; half rooms are normal (1.5, 2.5).
    const roomsText = draft.rooms.trim();
    if (roomsText.length > 0) {
      const rooms = Number(roomsText);
      if (!Number.isFinite(rooms) || rooms <= 0) return t("newListing.invalidRooms");
    }

    const floor = Number(draft.storeyFloorNumber);
    if (draft.storey === "floor" && (!Number.isInteger(floor) || floor <= 0)) {
      return t("newListing.invalidStoreyFloorNumber");
    }

    return null;
  };

  const validateStepTwo = () =>
    (draft.mediaMode === "photos" && draft.photos.length > 0) || (draft.mediaMode === "video" && draft.video)
      ? null
      : t("newListing.mediaRequired");

  const videoTooLargeMessage = () =>
    t("newListing.videoTooLarge", { limitMb: Math.round(MAX_VIDEO_BYTES / (1024 * 1024)) });

  const publishMutation = useMutation({
    mutationFn: async () => {
      const stepOneError = validateStepOne();
      if (stepOneError) throw new Error(stepOneError);
      const stepTwoError = validateStepTwo();
      if (stepTwoError) throw new Error(stepTwoError);
      if (!sessionUser) throw new Error(t("newListing.loginRequired"));
      // Content filter before any upload or write (store guideline 1.2 in the app).
      if (containsObjectionableContent(draft.description)) throw new Error(t("moderation.blockedContent"));

      // Compress and size-check the video BEFORE creating the row, so an
      // oversize file never leaves a listing to roll back.
      let video: (OptimizedMedia & { bytes: Uint8Array }) | null = null;
      if (draft.mediaMode === "video" && draft.video) {
        setProgress({ phase: "video", percent: 0 });
        const optimized = await optimizeVideo(draft.video.uri, (fraction) =>
          setProgress({ phase: "video", percent: Math.round(fraction * 100) }),
        );
        const { bytes, size } = await bytesOf(optimized.uri);
        if (size > MAX_VIDEO_BYTES) throw new Error(videoTooLargeMessage());
        video = { ...optimized, bytes };
      }

      // Free launch (PACKAGES_ENABLED = false): no tier; the database stamps
      // the standard one and the 30-day expiry.
      const input: CreateListingInput = {
        ...columnsFromDraft(draft),
        user_id: sessionUser.id,
        media_mode: draft.mediaMode!,
        tier: null,
      } as CreateListingInput;
      const listing = await createListing(input);

      try {
        if (draft.mediaMode === "photos") {
          let done = 0;
          setProgress({ phase: "upload", done, total: draft.photos.length });
          const rows = await mapWithConcurrency(draft.photos, PHOTO_CONCURRENCY, async (photoUri, index) => {
            const optimized = await optimizeImage(photoUri, IMAGE_PRESETS.listingPhoto);
            const { bytes } = await bytesOf(optimized.uri);
            const uploaded = await uploadPhotoToStorage({
              fileName: `${sessionUser.id}/${listing.id}/photo-${index + 1}.${optimized.extension}`,
              fileExtension: optimized.extension,
              fileBuffer: bytes,
              contentType: optimized.mimeType,
            });
            done += 1;
            setProgress({ phase: "upload", done, total: draft.photos.length });
            return {
              listing_id: listing.id,
              kind: "photo" as const,
              storage_path: uploaded.storagePath,
              public_url: uploaded.publicUrl,
              sort_order: index,
            };
          });
          await createListingMedia(rows);
        }

        if (draft.mediaMode === "video" && video) {
          setProgress({ phase: "upload", done: 0, total: 1 });
          const uploaded = await uploadVideoToStorage({
            fileName: `${sessionUser.id}/${listing.id}/video.${video.extension}`,
            fileExtension: video.extension,
            fileBuffer: video.bytes,
            contentType: video.mimeType,
          });
          await createListingMedia([
            {
              listing_id: listing.id,
              kind: "video",
              storage_path: uploaded.storagePath,
              public_url: uploaded.publicUrl,
              sort_order: 0,
            },
          ]);
        }
      } catch (uploadError) {
        try {
          await deleteListingById(listing.id);
        } catch (rollbackError) {
          console.log("Failed to roll back listing after media upload failed", rollbackError);
        }
        const raw = String((uploadError as { message?: unknown })?.message ?? "");
        throw new Error(
          /exceeded the maximum allowed size/i.test(raw) ? videoTooLargeMessage() : t("newListing.mediaUploadFailed"),
        );
      }

      return listing.id as number;
    },
    onSuccess: async (listingId) => {
      isDirtyRef.current = false;
      await queryClient.invalidateQueries({ queryKey: queryKeys.listings, refetchType: "all" });
      if (sessionUser) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.userListings(sessionUser.id), refetchType: "all" });
      }
      showToast({ type: "success", message: t("newListing.publishSuccess") });
      router.replace(`/listing/${listingId}`);
    },
    onError: (error) => {
      showToast({
        type: "error",
        title: t("newListing.publishErrorTitle"),
        message: (error instanceof Error && error.message) || t("newListing.publishErrorFallback"),
      });
    },
    onSettled: () => setProgress(null),
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      const stepOneError = validateStepOne();
      if (stepOneError) throw new Error(stepOneError);
      if (!sessionUser) throw new Error(t("newListing.loginRequired"));
      if (!editedListing) throw new Error(t("newListing.editLoadFailed"));
      if (containsObjectionableContent(draft.description)) throw new Error(t("moderation.blockedContent"));

      try {
        // Columns only — media stays as published, and media_mode is left alone.
        await updateListing(editedListing.id, columnsFromDraft(draft));
      } catch (error) {
        if ((error as Error)?.message === "LISTING_UPDATE_FORBIDDEN") throw new Error(t("newListing.editForbidden"));
        throw error;
      }
      return editedListing.id;
    },
    onSuccess: async (listingId) => {
      isDirtyRef.current = false;
      await queryClient.invalidateQueries({ queryKey: queryKeys.listings, refetchType: "all" });
      await queryClient.invalidateQueries({ queryKey: queryKeys.listing(String(listingId)), refetchType: "all" });
      if (sessionUser) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.userListings(sessionUser.id), refetchType: "all" });
      }
      showToast({ type: "success", message: t("newListing.editSuccess") });
      router.replace(`/listing/${listingId}`);
    },
    onError: (error) => {
      showToast({
        type: "error",
        title: t("newListing.editErrorTitle"),
        message: (error instanceof Error && error.message) || t("newListing.publishErrorFallback"),
      });
    },
  });

  const isSubmitting = publishMutation.isPending || editMutation.isPending;

  const handleStepOne = () => {
    const error = validateStepOne();
    if (error) {
      showToast({ type: "error", title: t("newListing.missingInformationTitle"), message: error });
      return;
    }
    if (isEditing) {
      editMutation.mutate();
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0 });
  };

  const handlePublish = () => {
    const error = validateStepTwo();
    if (error) {
      showToast({ type: "error", title: t("newListing.missingInformationTitle"), message: error });
      return;
    }
    publishMutation.mutate();
  };

  // Editing works whatever the account type (a seller turned buyer still owns
  // their listings); only the create screen is swapped for buyers.
  if (!isEditing) {
    if (isLoadingProfile) return <Spinner className="py-24" />;
    if (currentUser?.accountType === "buyer") return <LoanCalculator />;
  }

  if (isEditing && editListingQuery.isLoading) return <Spinner className="py-24" />;
  if (isEditing && (editListingQuery.isError || !editedListing)) {
    return <p className="px-6 py-24 text-center text-text-muted">{t("newListing.editLoadFailed")}</p>;
  }

  const progressLabel =
    progress?.phase === "video"
      ? t("web.newListing.compressingVideo", { percent: progress.percent })
      : progress?.phase === "upload"
        ? `${t("web.newListing.uploadingMedia")} ${progress.total > 1 ? `${progress.done}/${progress.total}` : ""}`
        : null;

  return (
    <div className="mx-auto w-full max-w-page px-4 pb-28 pt-6 md:px-8 md:pb-16 md:pt-10">
      <div className="mb-6 flex items-center gap-4">
        <h1 className="flex-1 font-display text-3xl text-text">
          {isEditing ? t("web.newListing.editTitle") : t("newListing.title")}
        </h1>
        {!isEditing ? (
          <ol className="flex items-center gap-2 text-sm" aria-label={t("newListing.step")}>
            {[1, 2].map((number) => (
              <li
                key={number}
                aria-current={step === number ? "step" : undefined}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full font-semibold",
                  step === number ? "bg-primary text-text-on-primary" : "bg-surface text-text-muted",
                )}
              >
                {number}
              </li>
            ))}
          </ol>
        ) : null}
      </div>

      <div className="rounded-[32px] bg-surface p-5 md:p-8">
        {step === 1 ? (
          <ListingDetailsForm draft={draft} onDraftChange={updateDraft} />
        ) : (
          <>
            <h2 className="mb-4 font-display text-lg text-text">{t("newListing.photosAndVideos")}</h2>
            <ListingMediaStep
              draft={draft}
              onChange={(next) => {
                isDirtyRef.current = true;
                setDraft((current) => ({ ...current, ...next }));
              }}
            />
          </>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-[76px] z-30 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur md:static md:mt-6 md:border-0 md:bg-transparent md:p-0">
        <div className="mx-auto flex max-w-page items-center gap-3">
          {step === 2 ? (
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={isSubmitting}
              aria-label={t("common.back")}
              className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-primary-soft text-text-on-primary disabled:opacity-60"
            >
              <AnchorRightIcon width={16} height={16} className="rotate-180" aria-hidden />
            </button>
          ) : null}
          {progressLabel ? (
            <p className="flex-1 text-sm font-semibold text-text-muted" aria-live="polite">
              {progressLabel}
            </p>
          ) : (
            <span className="flex-1" />
          )}
          {step === 1 ? (
            <Button
              title={
                isEditing
                  ? isSubmitting
                    ? t("common.posting")
                    : t("newListing.saveChanges")
                  : `${t("web.newListing.next")} · ${t("newListing.step")} 1/2`
              }
              onClick={handleStepOne}
              disabled={isSubmitting}
              iconSvg={AnchorRightIcon}
              iconAlignment="right"
            />
          ) : (
            <Button
              title={isSubmitting ? t("common.posting") : t("newListing.publishListing")}
              onClick={handlePublish}
              disabled={isSubmitting}
              iconSvg={AnchorRightIcon}
              iconAlignment="right"
            />
          )}
        </div>
      </div>
    </div>
  );
}
