"use client";

import AnchorRightIcon from "@assets/icons/anchor-right-icon.svg";
import Button from "@/components/genericComponents/Button";
import { Spinner } from "@/components/genericComponents/EmptyState";
import {
  ListingDetailsForm,
  STEP_ONE_FIELD_ORDER,
  type StepOneErrors,
} from "@/components/newListing/ListingDetailsForm";
import { ListingMediaStep } from "@/components/newListing/ListingMediaStep";
import { StepProgress } from "@/components/newListing/StepProgress";
import { useToast } from "@/components/providers/ToastProvider";
import { NEW_LISTING_DRAFT_KEY } from "@/constants/storageKeys";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRouter } from "@/i18n/navigation";
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
import { confirmDestructiveAction } from "@/utils/confirmAction";
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

// What the saved draft keeps: every field, without the media (blob: URLs of
// files picked in this tab, gone after a reload) or the country (filled in
// automatically).
const draftFields = (draft: NewListingDraft) => {
  const { photos: _photos, video: _video, mediaMode: _mediaMode, state: _state, ...fields } = draft;
  return fields;
};

// Nothing typed yet. The country is filled in on open, so it doesn't count.
const isDraftEmpty = (draft: NewListingDraft) =>
  JSON.stringify(draftFields(draft)) === JSON.stringify(draftFields(initialDraft)) &&
  draft.photos.length === 0 &&
  !draft.video;

const readSavedDraft = (): Partial<NewListingDraft> | null => {
  try {
    const raw = window.localStorage.getItem(NEW_LISTING_DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Partial<NewListingDraft>) : null;
  } catch {
    return null;
  }
};

const writeSavedDraft = (draft: NewListingDraft | null) => {
  try {
    if (draft && !isDraftEmpty(draft)) {
      window.localStorage.setItem(NEW_LISTING_DRAFT_KEY, JSON.stringify(draftFields(draft)));
    } else {
      window.localStorage.removeItem(NEW_LISTING_DRAFT_KEY);
    }
  } catch {
    // Storage blocked or full: the draft just isn't kept.
  }
};

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
  const { sessionUser } = useCurrentUser();
  const [step, setStep] = useState<1 | 2>(1);
  const [draft, setDraft] = useState<NewListingDraft>(initialDraft);
  const [progress, setProgress] = useState<Progress>(null);
  // Step 1's problems, shown under their fields; the revision bumps on every
  // failed Next so the page scrolls to the first one even if it is the same.
  const [stepOneErrors, setStepOneErrors] = useState<StepOneErrors>({});
  const [errorRevision, setErrorRevision] = useState(0);
  const isDirtyRef = useRef(false);
  const hasPrefilledRef = useRef(false);
  const hasRestoredDraftRef = useRef(false);

  // The unfinished listing survives a reload or a closed tab, like the app's:
  // restored once on open, then saved as it changes. Editing never touches it.
  useEffect(() => {
    if (isEditing || hasRestoredDraftRef.current) return;
    hasRestoredDraftRef.current = true;

    const saved = readSavedDraft();
    if (!saved) return;
    const restored: NewListingDraft = { ...initialDraft, ...saved, photos: [], video: null, mediaMode: null };
    if (isDraftEmpty(restored)) return;

    setDraft(restored);
    showToast({ type: "info", message: t("newListing.draftRestored") });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  useEffect(() => {
    if (isEditing || !hasRestoredDraftRef.current) return;
    const timeout = setTimeout(() => writeSavedDraft(draft), 400);
    return () => clearTimeout(timeout);
  }, [draft, isEditing]);

  const discardDraft = () =>
    confirmDestructiveAction({
      title: t("newListing.discardDraftTitle"),
      message: t("newListing.discardDraftMessage"),
      confirmLabel: t("newListing.discardDraftConfirm"),
      onConfirm: () => {
        isDirtyRef.current = false;
        setDraft(initialDraft);
        setStep(1);
        setStepOneErrors({});
        writeSavedDraft(null);
        window.scrollTo({ top: 0 });
      },
    });

  // Scrolls to and focuses the first field with a problem.
  useEffect(() => {
    if (errorRevision === 0) return;
    const firstKey = STEP_ONE_FIELD_ORDER.find((key) => stepOneErrors[key]);
    if (!firstKey) return;
    const field = document.querySelector<HTMLElement>(`[data-field="${firstKey}"]`);
    field?.scrollIntoView({ behavior: "smooth", block: "center" });
    field?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorRevision]);

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
    // Editing a field takes its error away.
    setStepOneErrors((current) => {
      if (!current[key]) return current;
      const { [key]: _removed, ...rest } = current;
      return rest;
    });
  };

  // Every problem with step 1 at once, keyed by the field it belongs to, so
  // each one shows under its own field instead of one toast at a time.
  const validateStepOneFields = (): StepOneErrors => {
    const errors: StepOneErrors = {};
    const add = (key: keyof NewListingDraft, message: string) => {
      if (!errors[key]) errors[key] = message;
    };

    // The country is filled in automatically; if it is ever missing, the city
    // field is where the user can do something about it.
    if (!draft.state.trim()) add("city", t("newListing.stateRequired"));
    if (!draft.city.trim()) add("city", t("newListing.cityRequired"));
    if (!draft.municipality.trim()) add("municipality", t("newListing.municipalityRequired"));
    if (!draft.street.trim()) add("street", t("newListing.streetRequired"));

    const streetNumberText = draft.streetNumber.trim();
    if (streetNumberText.length > 0) {
      const streetNumber = Number(streetNumberText);
      if (!Number.isInteger(streetNumber) || streetNumber <= 0) add("streetNumber", t("newListing.invalidStreetNumber"));
    }

    if (!draft.surfaceM2.trim()) {
      add("surfaceM2", t("newListing.surfaceRequired"));
    } else {
      const surface = Number(draft.surfaceM2);
      if (!Number.isFinite(surface) || surface <= 0) add("surfaceM2", t("newListing.invalidSurface"));
    }

    // Optional; half rooms are normal (1.5, 2.5).
    const roomsText = draft.rooms.trim();
    if (roomsText.length > 0) {
      const rooms = Number(roomsText);
      if (!Number.isFinite(rooms) || rooms <= 0) add("rooms", t("newListing.invalidRooms"));
    }

    if (!draft.priceEur.trim()) {
      add("priceEur", t("newListing.priceRequired"));
    } else {
      const price = Number(draft.priceEur);
      if (!Number.isFinite(price) || price <= 0) add("priceEur", t("newListing.invalidPrice"));
    }

    const totalText = draft.totalPriceEur.trim();
    if (draft.listingType === "forSale" && totalText.length > 0) {
      const total = Number(totalText);
      if (!Number.isSafeInteger(total) || total <= 0) add("totalPriceEur", t("newListing.invalidTotalPrice"));
    }

    if (draft.storey === "floor") {
      if (!draft.storeyFloorNumber.trim()) {
        add("storeyFloorNumber", t("newListing.storeyFloorNumberRequired"));
      } else {
        const floor = Number(draft.storeyFloorNumber);
        if (!Number.isInteger(floor) || floor <= 0) add("storeyFloorNumber", t("newListing.invalidStoreyFloorNumber"));
      }
    }

    if (draft.groundType === "other" && !draft.groundOther.trim()) {
      add("groundOther", t("newListing.groundOtherRequired"));
    }

    return errors;
  };

  /** The first step-1 problem as a message: the publish and save guard's check. */
  const validateStepOne = () => {
    const errors = validateStepOneFields();
    const firstKey = STEP_ONE_FIELD_ORDER.find((key) => errors[key]);
    return firstKey ? (errors[firstKey] ?? null) : null;
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
      // Published: the draft has done its job.
      hasRestoredDraftRef.current = false;
      writeSavedDraft(null);
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
    const errors = validateStepOneFields();
    if (Object.keys(errors).length > 0) {
      setStepOneErrors(errors);
      setErrorRevision((revision) => revision + 1);
      return;
    }
    setStepOneErrors({});
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

  if (isEditing && editListingQuery.isLoading) return <Spinner className="py-24" />;
  if (isEditing && (editListingQuery.isError || !editedListing)) {
    return <p className="px-6 py-24 text-center text-text-muted">{t("newListing.editLoadFailed")}</p>;
  }

  const progressLabel =
    progress?.phase === "video"
      ? t("web.newListing.compressingVideo", { percent: progress.percent })
      : progress?.phase === "upload"
        ? progress.total > 1
          ? t("newListing.uploadProgress", { done: progress.done, total: progress.total })
          : t("web.newListing.uploadingMedia")
        : null;

  return (
    <div className="mx-auto w-full max-w-page px-4 pb-28 pt-6 md:px-8 md:pb-16 md:pt-10">
      <div className="mb-6 flex items-center gap-4">
        <h1 className="flex-1 font-display text-3xl text-text">
          {isEditing ? t("web.newListing.editTitle") : t("newListing.title")}
        </h1>
        {!isEditing && !isDraftEmpty(draft) ? (
          <button
            type="button"
            onClick={discardDraft}
            disabled={isSubmitting}
            className="shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold text-primary hover:bg-surface disabled:opacity-60"
          >
            {t("newListing.discardDraft")}
          </button>
        ) : null}
      </div>
      {!isEditing ? <StepProgress step={step} total={2} className="-mt-2 mb-6" /> : null}

      <div className="rounded-[32px] bg-surface p-5 md:p-8">
        {step === 1 ? (
          <ListingDetailsForm draft={draft} onDraftChange={updateDraft} errors={stepOneErrors} />
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
                  : t("newListing.nextStep")
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
