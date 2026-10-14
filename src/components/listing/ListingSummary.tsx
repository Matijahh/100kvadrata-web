"use client";

import ChatIcon from "@assets/icons/chat-icon.svg";
import FlagIcon from "@assets/icons/flag-icon.svg";
import HeartFilledIcon from "@assets/icons/heart-icon-filled.svg";
import HeartIcon from "@assets/icons/heart-icon.svg";
import PinIcon from "@assets/icons/pin-icon.svg";
import SaveFilledIcon from "@assets/icons/save-icon-filled.svg";
import SaveIcon from "@assets/icons/save-icon.svg";
import ShareIcon from "@assets/icons/share-icon.svg";
import StarFilledIcon from "@assets/icons/star-icon-filled.svg";
import Avatar from "@/components/genericComponents/Avatar";
import { useListingActions } from "@/hooks/useListingActions";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { getListingAddressLabel } from "@/lib/listingFormat";
import { isPremiumTier } from "@/lib/packages";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Listing } from "@/types/types";
import { getListingPriceLabel } from "@/utils/listingPrice";
import type { FC, SVGProps } from "react";
import { useTranslation } from "react-i18next";

// Fixed brand accents from the app's card (they sit on media there, so they
// are not theme tokens): gold for saved and the Exclusive badge, coral for liked.
const SAVED_COLOR = "#F4C542";
const LIKED_COLOR = "#FF6B6B";
const EXCLUSIVE_TEXT = "#2A2200";

/** Exclusive (seller) beats Premium (listing tier) — one badge, never two. */
export function ListingBadge({ listing, className }: { listing: Listing; className?: string }) {
  const { t } = useTranslation();
  const isExclusive = listing.user?.isExclusive === true;

  if (!isExclusive && !isPremiumTier(listing.tier)) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        isExclusive ? "text-[#2A2200]" : "bg-primary text-text-on-primary",
        className,
      )}
      style={isExclusive ? { backgroundColor: SAVED_COLOR, color: EXCLUSIVE_TEXT } : undefined}
    >
      <StarFilledIcon width={12} height={12} aria-hidden />
      {isExclusive ? t("packages.exclusiveBadge") : t("packages.premiumBadge")}
    </span>
  );
}

/** Price, badge, address, seller and the viewer's actions — the top of a listing. */
export function ListingSummary({ listing }: { listing: Listing }) {
  return (
    <div className="flex flex-col gap-4">
      <ListingHeadline listing={listing} />
      <ListingActions listing={listing} />
    </div>
  );
}

/**
 * Price, badge, address and seller. The listing page and the feed's details
 * sheet pin it while the details scroll, and pass `showSize` to put the
 * surface on its right.
 */
export function ListingHeadline({
  listing,
  showSize = false,
  className,
}: {
  listing: Listing;
  showSize?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  const sessionUser = useAuthStore((state) => state.sessionUser);
  const price = getListingPriceLabel(listing, t);
  const address = getListingAddressLabel(listing);
  const username = listing.user?.username ?? t("common.userFallback");
  const isOwnListing = !!sessionUser && sessionUser.id === listing.user_id;
  const profileHref = isOwnListing ? "/profile" : `/user/${listing.user_id}`;
  const size = showSize && listing.surface_m2 != null ? `${listing.surface_m2} m²` : null;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5">
          {price ? (
            <p className="font-display text-[28px] leading-tight text-text md:text-[32px]">{price}</p>
          ) : null}
          <ListingBadge listing={listing} />
        </div>
        {size ? (
          <p className="shrink-0 rounded-full bg-surface-muted px-4 py-1.5 font-display text-[22px] leading-tight text-text">
            {size}
          </p>
        ) : null}
      </div>

      {address ? (
        <p className="flex items-center gap-1.5 text-[15px] text-text-muted">
          <PinIcon width={12} height={14} className="shrink-0" aria-hidden />
          <span>{address}</span>
        </p>
      ) : null}

      <Link
        href={profileHref}
        className="flex items-center gap-3 self-start rounded-full py-1 pr-3 hover:bg-surface-muted"
      >
        <span className="block h-11 w-11 overflow-hidden rounded-full border-2 border-primary">
          <Avatar userId={listing.user_id} avatarUrl={listing.user?.avatarUrl} />
        </span>
        <span className="flex flex-col">
          <span className="text-[17px] font-semibold text-text">{username}</span>
          {listing.user?.agencyName ? (
            <span className="text-[13px] text-text-muted">{listing.user.agencyName}</span>
          ) : null}
        </span>
      </Link>
    </div>
  );
}

/**
 * Like, save, message, share and report. `isLikeCountLoading` swaps the like
 * count for a small spinner while the real count is still on its way.
 */
export function ListingActions({
  listing,
  isLikeCountLoading = false,
  className,
}: {
  listing: Listing;
  isLikeCountLoading?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  const actions = useListingActions(listing);

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <ActionButton
        icon={actions.isLiked ? HeartFilledIcon : HeartIcon}
        iconColor={actions.isLiked ? LIKED_COLOR : undefined}
        label={String(listing.likeCount ?? 0)}
        isLabelLoading={isLikeCountLoading}
        ariaLabel={t("web.listing.like")}
        pressed={actions.isLiked}
        disabled={actions.isLikePending}
        onClick={actions.toggleLike}
      />
      {/* Saving your own listing is pointless (it is on your profile), so
          the action is hidden on it — unless an old save needs undoing. */}
      {!actions.isOwnListing || actions.isSaved ? (
        <ActionButton
          icon={actions.isSaved ? SaveFilledIcon : SaveIcon}
          iconColor={actions.isSaved ? SAVED_COLOR : undefined}
          label={t("web.listing.save")}
          pressed={actions.isSaved}
          disabled={actions.isSavePending}
          onClick={actions.toggleSave}
        />
      ) : null}
      {!actions.isOwnListing ? (
        <ActionButton
          icon={ChatIcon}
          label={t("web.listing.message")}
          variant="primary"
          disabled={actions.isChatPending}
          onClick={actions.openChat}
        />
      ) : null}
      <ActionButton icon={ShareIcon} label={t("web.listing.share")} onClick={actions.share} />
      {actions.isSignedIn && !actions.isOwnListing ? (
        <ActionButton
          icon={FlagIcon}
          label={t("web.listing.report")}
          variant="quiet"
          onClick={actions.report}
        />
      ) : null}
    </div>
  );
}

function ActionButton({
  icon: Icon,
  iconColor,
  label,
  isLabelLoading = false,
  ariaLabel,
  pressed,
  disabled,
  variant = "default",
  onClick,
}: {
  icon: FC<SVGProps<SVGSVGElement>>;
  iconColor?: string;
  label: string;
  isLabelLoading?: boolean;
  ariaLabel?: string;
  pressed?: boolean;
  disabled?: boolean;
  variant?: "default" | "primary" | "quiet";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel ? (isLabelLoading ? ariaLabel : `${ariaLabel} (${label})`) : undefined}
      aria-busy={isLabelLoading || undefined}
      aria-pressed={pressed}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60",
        variant === "default" && "bg-surface-muted text-text",
        variant === "primary" && "bg-primary text-text-on-primary",
        variant === "quiet" && "text-text-muted hover:bg-surface-muted",
      )}
    >
      <Icon
        width={20}
        height={20}
        aria-hidden
        className={cn(variant === "default" && !iconColor && "text-primary")}
        style={iconColor ? { color: iconColor } : undefined}
      />
      {isLabelLoading ? (
        <span
          aria-hidden
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent"
        />
      ) : (
        label
      )}
    </button>
  );
}
