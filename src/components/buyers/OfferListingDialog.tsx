"use client";

import ChevronDownIcon from "@assets/icons/chevron-down-icon.svg";
import CircleCheckFilledIcon from "@assets/icons/circle-check-icon-filled.svg";
import Button from "@/components/genericComponents/Button";
import { Spinner } from "@/components/genericComponents/EmptyState";
import { ListingSpecs } from "@/components/listing/ListingSpecs";
import { VideoPoster } from "@/components/media/VideoPoster";
import { useToast } from "@/components/providers/ToastProvider";
import { Modal } from "@/components/ui/Modal";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { formatListingMetric, getDaysLeft, isListingExpired } from "@/lib/listingFormat";
import { queryKeys } from "@/lib/queryKeys";
import { findOrCreateConversation, sendMessage } from "@/services/chat";
import { fetchUserListings } from "@/services/listings";
import type { Listing, Profile } from "@/types/types";
import { getListingPriceLabel } from "@/utils/listingPrice";
import { useMutation, useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * A seller sends one of their live listings to a buyer — web port of the
 * app's OfferApartmentSheet: same rows (first click selects, a second click on
 * the selected one shows what it is), same message, same chat it lands in.
 */
export function OfferListingDialog({
  buyer,
  currentUserId,
  onClose,
}: {
  /** The buyer to offer to; null closes the dialog. */
  buyer: Profile | null;
  currentUserId: string | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const isOpen = buyer !== null;
  const [selectedListingId, setSelectedListingId] = useState<number | null>(null);
  const [isSelectedExpanded, setSelectedExpanded] = useState(false);
  // isPending only flips on the next render; a fast double click could send twice.
  const isSendingRef = useRef(false);

  const listingsQuery = useQuery({
    queryKey: currentUserId ? queryKeys.userListings(currentUserId) : ["userListings", "guest"],
    queryFn: () => fetchUserListings(currentUserId!),
    enabled: !!currentUserId && isOpen,
  });

  useEffect(() => {
    if (!isOpen) {
      setSelectedListingId(null);
      setSelectedExpanded(false);
      isSendingRef.current = false;
    }
  }, [isOpen]);

  const sendOfferMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId || !buyer || selectedListingId == null) throw new Error("MISSING_OFFER_DATA");
      const conversation = await findOrCreateConversation(currentUserId, buyer.id, selectedListingId);
      await sendMessage(conversation.id, currentUserId, {
        content: t("buyers.offerMessageContent"),
        listingId: selectedListingId,
      });
      return conversation.id;
    },
    onSuccess: (conversationId) => {
      onClose();
      showToast({
        type: "success",
        title: t("buyers.offerSentTitle"),
        message: t("buyers.offerSentMessage"),
        onPress: () => router.push(`/chat/${conversationId}`),
      });
    },
    onSettled: () => {
      isSendingRef.current = false;
    },
    onError: (error) => {
      console.error("[OfferListingDialog] sendOffer failed:", error);
      showToast({ type: "error", message: t("buyers.offerSendFailed") });
    },
  });

  const handleSend = () => {
    if (isSendingRef.current || selectedListingId == null) return;
    isSendingRef.current = true;
    sendOfferMutation.mutate();
  };

  const handleRowClick = (listingId: number) => {
    if (selectedListingId === listingId) {
      setSelectedExpanded((expanded) => !expanded);
      return;
    }
    setSelectedListingId(listingId);
    setSelectedExpanded(false);
  };

  // Only what a buyer could actually open; the query is shared with the
  // profile grid, where expired listings belong.
  const listings = (listingsQuery.data ?? []).filter((listing) => !isListingExpired(listing));

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => (open ? undefined : onClose())}
      title={t("buyers.offerSheetTitle")}
      description={buyer?.username ? t("buyers.offerSheetSubtitle", { username: buyer.username }) : undefined}
      className="md:max-w-xl"
    >
      <div className="mt-5" role="radiogroup" aria-label={t("buyers.offerSheetTitle")}>
        {listingsQuery.isLoading ? (
          <Spinner />
        ) : listings.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">{t("buyers.noListingsToOffer")}</p>
        ) : (
          <ul className="flex max-h-[55dvh] flex-col gap-2.5 overflow-y-auto pr-1">
            {listings.map((listing) => {
              const isSelected = selectedListingId === listing.id;
              return (
                <li key={listing.id}>
                  <OfferRow
                    listing={listing}
                    isSelected={isSelected}
                    isExpanded={isSelected && isSelectedExpanded}
                    onClick={() => handleRowClick(listing.id)}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Button
        title={sendOfferMutation.isPending ? t("buyers.sendingOffer") : t("buyers.sendOffer")}
        onClick={handleSend}
        disabled={selectedListingId == null || sendOfferMutation.isPending}
        fullWidth
        className="mt-5"
      />
    </Modal>
  );
}

function OfferRow({
  listing,
  isSelected,
  isExpanded,
  onClick,
}: {
  listing: Listing;
  isSelected: boolean;
  isExpanded: boolean;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  const cover = listing.media.find((item) => item.kind === "photo")?.public_url ?? null;
  const videoUrl = listing.media.find((item) => item.kind === "video")?.public_url ?? listing.video_url ?? null;
  const price = getListingPriceLabel(listing, t);
  const street = [listing.street?.trim(), listing.street_number ?? null].filter((part) => part != null && part !== "").join(" ");
  const address = [street, listing.municipality?.trim(), listing.city?.trim()].filter(Boolean).join(", ");
  const kind = [
    listing.category ? t(`newListing.categories.${listing.category}`) : null,
    listing.listing_type ? t(`newListing.listingTypes.${listing.listing_type}`) : null,
  ]
    .filter(Boolean)
    .join(", ");
  const facts = [
    listing.surface_m2 != null ? t("buyers.offerSurface", { value: formatListingMetric(listing.surface_m2) }) : null,
    listing.rooms != null ? t("buyers.offerRooms", { count: listing.rooms }) : null,
  ].filter((fact): fact is string => !!fact);
  const daysLeft = getDaysLeft(listing);
  const daysLeftLabel =
    daysLeft == null ? null : Math.max(1, daysLeft) === 1 ? t("listing.dayLeft") : t("listing.daysLeft", { count: daysLeft });

  return (
    <div
      className={cn(
        "rounded-3xl border-2 transition-colors",
        isSelected ? "border-primary bg-primary/5" : "border-border bg-surface hover:border-primary-soft",
      )}
    >
      <button
        type="button"
        role="radio"
        aria-checked={isSelected}
        aria-expanded={isSelected ? isExpanded : undefined}
        onClick={onClick}
        className="flex w-full items-center gap-3 p-3 text-left"
      >
        <span className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-2xl bg-media-placeholder">
          {cover ? (
            <Image src={cover} alt="" fill sizes="72px" className="object-cover" />
          ) : videoUrl ? (
            // A video-only listing has nothing else to show, so a still from it.
            <VideoPoster videoUrl={videoUrl} size="small" />
          ) : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-text">{price ?? kind}</span>
          {address ? <span className="block truncate text-[13px] text-text-muted">{address}</span> : null}
          {price && kind ? <span className="block truncate text-[13px] text-text-muted">{kind}</span> : null}
          {facts.length > 0 || daysLeftLabel ? (
            <span className="mt-1 flex flex-wrap gap-1.5">
              {facts.map((fact) => (
                <span key={fact} className="rounded-full bg-surface-muted px-2 py-0.5 text-[12px] text-text">
                  {fact}
                </span>
              ))}
              {daysLeftLabel ? (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[12px] text-primary">{daysLeftLabel}</span>
              ) : null}
            </span>
          ) : null}
        </span>
        {isSelected ? (
          <CircleCheckFilledIcon width={24} height={24} className="shrink-0 text-primary" aria-hidden />
        ) : (
          <span className="h-6 w-6 shrink-0 rounded-full border-2 border-border" aria-hidden />
        )}
      </button>

      {isSelected ? (
        <div className="px-3 pb-3">
          {isExpanded ? (
            <div className="mb-3 rounded-2xl bg-surface p-4">
              <ListingSpecs listing={listing} />
              <Link
                href={`/listing/${listing.id}`}
                target="_blank"
                className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
              >
                {t("web.feed.openListing")}
              </Link>
            </div>
          ) : null}
          <button
            type="button"
            onClick={onClick}
            className="flex w-full items-center justify-center gap-1 text-sm font-semibold text-primary"
          >
            {t(isExpanded ? "buyers.offerHideDetails" : "buyers.offerShowDetails")}
            <ChevronDownIcon width={14} height={14} className={cn(isExpanded && "rotate-180")} aria-hidden />
          </button>
        </div>
      ) : null}
    </div>
  );
}
