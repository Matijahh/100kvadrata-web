"use client";

import AnchorRightIcon from "@assets/icons/anchor-right-icon.svg";
import EditIcon from "@assets/icons/edit-icon.svg";
import EyeIcon from "@assets/icons/show-icon.svg";
import TrashIcon from "@assets/icons/trash-icon.svg";
import { ListingMedia } from "@/components/listing/ListingMedia";
import { ListingSpecs } from "@/components/listing/ListingSpecs";
import { ListingSummary } from "@/components/listing/ListingSummary";
import { useToast } from "@/components/providers/ToastProvider";
import { useListingViewTracker } from "@/hooks/useListingViewTracker";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { getDaysLeft, isListingExpired } from "@/lib/listingFormat";
import { queryKeys } from "@/lib/queryKeys";
import { deleteListing, fetchListingById, fetchOwnListingViewCounts } from "@/services/listings";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Listing } from "@/types/types";
import { confirmDestructiveAction } from "@/utils/confirmAction";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * The listing page. Desktop: the media fills the left of the screen and stays
 * put while the details scroll on the right. Phone: media on top, details
 * below — the full-screen swipe card lives in the feed, and a link someone
 * opened deserves a page they can read and scroll.
 */
export function ListingView({ initialListing }: { initialListing: Listing }) {
  const { t } = useTranslation();
  const router = useRouter();
  const sessionUser = useAuthStore((state) => state.sessionUser);
  const listingId = initialListing.id;

  // Server-rendered data seeds the cache; optimistic like counts and edits
  // made elsewhere update it from here on.
  const { data: listing = initialListing } = useQuery({
    queryKey: queryKeys.listing(listingId.toString()),
    queryFn: () => fetchListingById(listingId),
    initialData: initialListing,
    staleTime: 60_000,
  });

  useListingViewTracker(listing, true);

  const isOwnListing = !!sessionUser && sessionUser.id === listing.user_id;
  const isExpired = isListingExpired(listing);

  const goBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.replace("/feed");
    }
  };

  return (
    <div className="bg-surface md:grid md:min-h-dvh md:grid-cols-[minmax(0,1fr)_minmax(380px,460px)] xl:grid-cols-[minmax(0,1fr)_520px]">
      <div className="relative md:sticky md:top-0 md:h-dvh">
        <ListingMedia
          listing={listing}
          isActive
          priority
          className="aspect-[4/5] max-h-[72dvh] w-full md:aspect-auto md:h-full md:max-h-none"
        />
        <button
          type="button"
          onClick={goBack}
          aria-label={t("web.listing.back")}
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm hover:bg-black/60"
        >
          <AnchorRightIcon width={16} height={16} className="rotate-180" aria-hidden />
        </button>
      </div>

      <div className="flex flex-col gap-7 px-5 pb-10 pt-6 md:overflow-y-auto md:px-8 md:pt-10">
        {isExpired && !isOwnListing ? (
          <p className="rounded-2xl bg-surface-muted px-4 py-3 text-sm text-text-muted">
            {t("web.listing.expiredNotice")}
          </p>
        ) : null}

        <ListingSummary listing={listing} />

        {isOwnListing ? <OwnerTools listing={listing} /> : null}

        <OpenInAppButton listingId={listing.id} />

        <ListingSpecs listing={listing} />
      </div>
    </div>
  );
}

/** Days left, views, edit and delete — what the app shows the owner from their profile. */
function OwnerTools({ listing }: { listing: Listing }) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const sessionUser = useAuthStore((state) => state.sessionUser);
  const daysLeft = getDaysLeft(listing);

  const viewCountsQuery = useQuery({
    queryKey: queryKeys.listingViewCounts(sessionUser?.id ?? ""),
    queryFn: fetchOwnListingViewCounts,
    enabled: !!sessionUser,
  });
  const views = viewCountsQuery.data?.[listing.id] ?? null;

  const deleteMutation = useMutation({
    mutationFn: () => deleteListing(listing),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.listing(listing.id.toString()) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.listings });
      if (sessionUser) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.userListings(sessionUser.id) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.savedListings(sessionUser.id) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.savedListingIds(sessionUser.id) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.likedListingIds(sessionUser.id) });
      }
      router.replace("/profile");
    },
    onError: () => {
      showToast({ type: "error", message: t("listing.deleteErrorMessage") });
    },
  });

  const handleDelete = () => {
    if (deleteMutation.isPending) return;
    confirmDestructiveAction({
      title: t("listing.deleteTitle"),
      message: t("listing.deleteMessage"),
      confirmLabel: t("listing.deleteAction"),
      onConfirm: () => deleteMutation.mutate(),
    });
  };

  return (
    <section className="rounded-3xl border border-border p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="mr-auto text-[13px] font-semibold uppercase tracking-wide text-text-muted">
          {t("web.listing.ownerTools")}
        </h2>
        {daysLeft != null ? (
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-semibold",
              daysLeft <= 0 ? "bg-destructive/15 text-destructive" : "bg-surface-muted text-text",
            )}
          >
            {daysLeft <= 0
              ? t("listing.expired")
              : daysLeft === 1
                ? t("listing.dayLeft")
                : t("listing.daysLeft", { count: daysLeft })}
          </span>
        ) : null}
        {views != null ? (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-text-muted"
            aria-label={t("listing.viewsCount", { count: views })}
          >
            <EyeIcon width={12} height={12} aria-hidden />
            {views}
          </span>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {/* Editing stays allowed after expiry: it changes content only; the
            lifecycle columns are pinned by a database trigger. */}
        <Link
          href={`/new-listing?editListingId=${listing.id}`}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-surface-muted px-4 text-sm font-semibold text-text hover:opacity-90"
        >
          <EditIcon width={18} height={18} className="text-primary" aria-hidden />
          {t("listing.editListing")}
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-60"
        >
          <TrashIcon width={18} height={18} aria-hidden />
          {t("listing.deleteListing")}
        </button>
      </div>
    </section>
  );
}

/**
 * Phones only. A universal link opened from this same domain never opens the
 * app (iOS deliberately keeps you in the browser), so this uses the app's own
 * scheme — a harmless no-op on a phone without the app.
 */
function OpenInAppButton({ listingId }: { listingId: number }) {
  const { t } = useTranslation();
  const [isPhone, setIsPhone] = useState(false);

  useEffect(() => {
    setIsPhone(/android|iphone|ipad|ipod/i.test(navigator.userAgent));
  }, []);

  if (!isPhone) {
    return null;
  }

  return (
    <a
      href={`stokvadrata://listing/${listingId}`}
      className="flex h-12 items-center justify-center rounded-full border-2 border-primary text-sm font-semibold text-primary"
    >
      {t("web.listing.openInApp")}
    </a>
  );
}
