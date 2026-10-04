"use client";

import ChatIcon from "@assets/icons/chat-icon.svg";
import ChevronUpIcon from "@assets/icons/chevron-up-icon.svg";
import HeartFilledIcon from "@assets/icons/heart-icon-filled.svg";
import HeartIcon from "@assets/icons/heart-icon.svg";
import PinIcon from "@assets/icons/pin-icon.svg";
import SaveFilledIcon from "@assets/icons/save-icon-filled.svg";
import SaveIcon from "@assets/icons/save-icon.svg";
import ShareIcon from "@assets/icons/share-icon.svg";
import Avatar from "@/components/genericComponents/Avatar";
import { buttonClasses } from "@/components/genericComponents/Button";
import { ListingMedia } from "@/components/listing/ListingMedia";
import { ListingSpecs } from "@/components/listing/ListingSpecs";
import { ListingBadge, ListingSummary } from "@/components/listing/ListingSummary";
import { Modal } from "@/components/ui/Modal";
import { useListingActions } from "@/hooks/useListingActions";
import { useListingViewTracker } from "@/hooks/useListingViewTracker";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { formatListingMetric, getListingAddressLabel } from "@/lib/listingFormat";
import type { Listing } from "@/types/types";
import { getListingPriceLabel } from "@/utils/listingPrice";
import { useState, type FC, type SVGProps } from "react";
import { useTranslation } from "react-i18next";

const SAVED_COLOR = "#F4C542";
const LIKED_COLOR = "#FF6B6B";

/**
 * One listing in the reel.
 *
 * - Phone: the media fills the screen with the price, place and actions laid
 *   over it, like the app's card; "Details" opens the full description in a
 *   sheet.
 * - Tablet: the same, as a 9:16 card in the middle of the screen.
 *
 * (Desktop shows the grid instead — the reel is only below 1024px.)
 *
 * `isNear` (within a card of the one on screen) decides whether the media
 * renders at all: far-away cards are empty boxes of the right height, so the
 * feed does not hold dozens of images in memory.
 */
export function ReelCard({
  listing,
  isActive,
  isNear,
}: {
  listing: Listing;
  isActive: boolean;
  isNear: boolean;
}) {
  const { t } = useTranslation();
  const [isDetailsOpen, setDetailsOpen] = useState(false);
  useListingViewTracker(listing, isActive);

  return (
    <div className="flex h-full w-full items-stretch justify-center md:px-6 md:py-5">
      <div
        className={cn(
          "relative h-full w-full overflow-hidden bg-black",
          "md:aspect-[9/16] md:w-auto md:max-w-full md:rounded-[32px] md:shadow-[0_12px_40px_rgba(0,0,0,0.18)]",
        )}
      >
        {isNear ? (
          <>
            <ListingMedia
              listing={listing}
              isActive={isActive}
              autoPlay
              priority={isActive}
              sizes="(min-width: 768px) 480px, 100vw"
              dotsPosition="top"
              minimalVideo
              className="h-full w-full bg-black"
            />
            <ReelOverlay listing={listing} onOpenDetails={() => setDetailsOpen(true)} />
          </>
        ) : null}
      </div>

      <Modal open={isDetailsOpen} onOpenChange={setDetailsOpen} title={t("web.feed.details")} hideTitle>
        <ListingDetails listing={listing} />
      </Modal>
    </div>
  );
}

function ListingDetails({ listing }: { listing: Listing }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6">
      <ListingSummary listing={listing} />
      <ListingSpecs listing={listing} />
      <Link href={`/listing/${listing.id}`} className={buttonClasses({ variant: "secondary", fullWidth: true })}>
        {t("web.feed.openListing")}
      </Link>
    </div>
  );
}

function ReelOverlay({ listing, onOpenDetails }: { listing: Listing; onOpenDetails: () => void }) {
  const { t } = useTranslation();
  const actions = useListingActions(listing);
  const price = getListingPriceLabel(listing, t);
  const address = getListingAddressLabel(listing);
  const username = listing.user?.username ?? t("common.userFallback");
  const profileHref = actions.isOwnListing ? "/profile" : `/user/${listing.user_id}`;
  const facts = [
    listing.category ? t(`newListing.categories.${listing.category}`) : null,
    listing.surface_m2 != null ? `${listing.surface_m2} m²` : null,
    listing.rooms != null ? `${formatListingMetric(listing.rooms)} ${t("web.listing.roomsShort")}` : null,
  ].filter(Boolean);

  return (
    // Click-through except on the controls, so taps on the media still reach
    // the photo viewer and the video.
    <div className="pointer-events-none absolute inset-x-0 bottom-0">
      <div className="flex items-end gap-3 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-4 pb-[calc(96px+env(safe-area-inset-bottom))] pt-28 md:px-5 md:pb-6">
        <div className="min-w-0 flex-1 text-white">
          <ListingBadge listing={listing} className="mb-2" />
          {price ? (
            <p className="font-display text-[26px] leading-tight [text-shadow:0_1px_8px_rgba(0,0,0,0.35)]">{price}</p>
          ) : null}
          {address ? (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-white/85">
              <PinIcon width={11} height={13} className="shrink-0" aria-hidden />
              <span className="truncate">{address}</span>
            </p>
          ) : null}
          {facts.length > 0 ? <p className="mt-0.5 truncate text-sm text-white/85">{facts.join(" · ")}</p> : null}
          <Link
            href={profileHref}
            className="pointer-events-auto mt-3 inline-flex max-w-full items-center gap-2 rounded-full py-1 pr-3 hover:bg-white/10"
          >
            <span className="block h-9 w-9 shrink-0 overflow-hidden rounded-full border-2 border-white">
              <Avatar userId={listing.user_id} avatarUrl={listing.user?.avatarUrl} />
            </span>
            <span className="truncate text-[15px] font-semibold">{username}</span>
          </Link>
        </div>

        <div className="pointer-events-auto flex flex-col items-center gap-3.5">
          <RoundAction
            icon={actions.isLiked ? HeartFilledIcon : HeartIcon}
            iconColor={actions.isLiked ? LIKED_COLOR : undefined}
            label={String(listing.likeCount ?? 0)}
            ariaLabel={t("web.listing.like")}
            pressed={actions.isLiked}
            disabled={actions.isLikePending}
            onClick={actions.toggleLike}
          />
          {!actions.isOwnListing || actions.isSaved ? (
            <RoundAction
              icon={actions.isSaved ? SaveFilledIcon : SaveIcon}
              iconColor={actions.isSaved ? SAVED_COLOR : undefined}
              ariaLabel={t("web.listing.save")}
              pressed={actions.isSaved}
              disabled={actions.isSavePending}
              onClick={actions.toggleSave}
            />
          ) : null}
          {!actions.isOwnListing ? (
            <RoundAction
              icon={ChatIcon}
              ariaLabel={t("web.listing.message")}
              disabled={actions.isChatPending}
              onClick={actions.openChat}
            />
          ) : null}
          <RoundAction icon={ShareIcon} ariaLabel={t("web.listing.share")} onClick={actions.share} />
          <RoundAction icon={ChevronUpIcon} ariaLabel={t("web.feed.details")} label={t("web.feed.details")} onClick={onOpenDetails} />
        </div>
      </div>
    </div>
  );
}

function RoundAction({
  icon: Icon,
  iconColor,
  label,
  ariaLabel,
  pressed,
  disabled,
  onClick,
}: {
  icon: FC<SVGProps<SVGSVGElement>>;
  iconColor?: string;
  label?: string;
  ariaLabel: string;
  pressed?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label && label !== ariaLabel ? `${ariaLabel} (${label})` : ariaLabel}
      aria-pressed={pressed}
      className="flex flex-col items-center gap-1 text-white disabled:opacity-60"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/35 backdrop-blur-sm transition-colors hover:bg-black/50">
        <Icon width={24} height={24} aria-hidden style={iconColor ? { color: iconColor } : undefined} />
      </span>
      {label ? <span className="text-xs font-semibold [text-shadow:0_1px_4px_rgba(0,0,0,0.5)]">{label}</span> : null}
    </button>
  );
}
