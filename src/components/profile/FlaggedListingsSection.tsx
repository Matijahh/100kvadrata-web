"use client";

import CheckIcon from "@assets/icons/check-icon.svg";
import FlagIcon from "@assets/icons/flag-icon.svg";
import TrashIcon from "@assets/icons/trash-icon.svg";
import { EmptyState, Spinner } from "@/components/genericComponents/EmptyState";
import { ListingCard, ListingGrid } from "@/components/listing/ListingCard";
import { useToast } from "@/components/providers/ToastProvider";
import { queryKeys } from "@/lib/queryKeys";
import {
  dismissListingReports,
  fetchFlaggedListings,
  removeListingForViolation,
} from "@/services/reports";
import type { FlaggedListing, ListingRemovalReason } from "@/types/types";
import { confirmDestructiveAction, promptDestructiveChoice } from "@/utils/confirmAction";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

/**
 * The admin's queue of reported listings (FEAT-43). Web counterpart of the
 * app's Flagged tab: there the actions sit in the listing screen's header,
 * here on each card, since a desktop grid has the room and a reported listing
 * that has expired can't be opened on its own page.
 */
export function FlaggedListingsSection() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const flaggedQuery = useQuery({
    queryKey: queryKeys.flaggedListings,
    queryFn: fetchFlaggedListings,
    // New reports keep arriving; re-read whenever the tab is shown.
    refetchOnMount: "always",
  });

  const dropFromQueue = (listingId: number) => {
    queryClient.setQueryData<FlaggedListing[] | undefined>(queryKeys.flaggedListings, (current) =>
      current?.filter((listing) => listing.id !== listingId),
    );
    void queryClient.invalidateQueries({ queryKey: queryKeys.flaggedListings });
    void queryClient.invalidateQueries({ queryKey: queryKeys.listings });
  };

  const removeMutation = useMutation({
    mutationFn: ({ listingId, reason }: { listingId: number; reason: ListingRemovalReason }) =>
      removeListingForViolation(listingId, reason),
    onSuccess: (result, { listingId }) => {
      dropFromQueue(listingId);
      showToast({
        type: "success",
        message: t(result.banned ? "moderation.removedAndBanned" : "moderation.removed"),
      });
    },
    onError: () => showToast({ type: "error", message: t("moderation.removeError") }),
  });

  const dismissMutation = useMutation({
    mutationFn: (listingId: number) => dismissListingReports(listingId),
    onSuccess: (_result, listingId) => {
      dropFromQueue(listingId);
      showToast({ type: "success", message: t("moderation.dismissed") });
    },
    onError: () => showToast({ type: "error", message: t("moderation.dismissError") }),
  });

  const busyId =
    (removeMutation.isPending ? removeMutation.variables?.listingId : undefined) ??
    (dismissMutation.isPending ? dismissMutation.variables : undefined);

  // Reason first, then a confirmation that spells out what happens. The
  // second dialog opens on the next tick: the first one closes itself right
  // after the click, and would otherwise close the new one with it.
  const askRemove = (listing: FlaggedListing) => {
    const confirmRemoval = (reason: ListingRemovalReason) =>
      setTimeout(() =>
        confirmDestructiveAction({
          title: t("moderation.removeConfirmTitle", {
            reason: t(reason === "spam" ? "moderation.reasonSpamLower" : "moderation.reasonInappropriateLower"),
          }),
          message: t("moderation.removeConfirmMessage"),
          confirmLabel: t("moderation.removeConfirm"),
          onConfirm: () => removeMutation.mutate({ listingId: listing.id, reason }),
        }),
      );

    promptDestructiveChoice({
      title: t("moderation.removeTitle"),
      message: t("moderation.removeReasonPrompt"),
      options: [
        { label: t("moderation.reasonSpam"), onPress: () => confirmRemoval("spam"), destructive: true },
        {
          label: t("moderation.reasonInappropriate"),
          onPress: () => confirmRemoval("inappropriate"),
          destructive: true,
        },
      ],
    });
  };

  const askDismiss = (listing: FlaggedListing) =>
    confirmDestructiveAction({
      title: t("moderation.dismissTitle"),
      message: t("moderation.dismissMessage"),
      confirmLabel: t("moderation.dismissConfirm"),
      onConfirm: () => dismissMutation.mutate(listing.id),
    });

  if (flaggedQuery.isLoading) return <Spinner />;
  if (flaggedQuery.isError) return <EmptyState title={t("moderation.flaggedLoadError")} />;

  const listings = flaggedQuery.data ?? [];
  if (listings.length === 0) return <EmptyState icon={FlagIcon} title={t("moderation.flaggedEmpty")} />;

  return (
    <ListingGrid>
      {listings.map((listing) => {
        const isBusy = busyId === listing.id;
        return (
          <div key={listing.id} className="flex flex-col gap-2">
            <ListingCard listing={listing} />
            <div className="flex items-center gap-2 px-1">
              <span className="flex min-w-0 flex-1 items-center gap-1.5 text-xs text-text-muted">
                <FlagIcon width={14} height={14} className="shrink-0" aria-hidden />
                <span className="truncate">
                  {t("moderation.reportCount", { count: listing.reportCount })}
                  {" · "}
                  {t("moderation.reportSummary", {
                    spam: listing.spamReportCount,
                    inappropriate: listing.inappropriateReportCount,
                  })}
                </span>
              </span>
              <button
                type="button"
                onClick={() => askDismiss(listing)}
                disabled={isBusy}
                aria-label={t("moderation.dismissReports")}
                title={t("moderation.dismissReports")}
                className="rounded-full p-2 text-primary hover:bg-surface disabled:opacity-50"
              >
                <CheckIcon width={20} height={20} aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => askRemove(listing)}
                disabled={isBusy}
                aria-label={t("moderation.removeListing")}
                title={t("moderation.removeListing")}
                className="rounded-full p-2 text-destructive hover:bg-surface disabled:opacity-50"
              >
                <TrashIcon width={20} height={20} aria-hidden />
              </button>
            </div>
          </div>
        );
      })}
    </ListingGrid>
  );
}
