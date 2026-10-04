"use client";

import EyeIcon from "@assets/icons/show-icon.svg";
import PinIcon from "@assets/icons/pin-icon.svg";
import PlayFilledIcon from "@assets/icons/play-icon-filled.svg";
import { ListingBadge } from "@/components/listing/ListingSummary";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { formatListingMetric, getListingAddressLabel, isListingExpired } from "@/lib/listingFormat";
import type { Listing } from "@/types/types";
import { getListingPriceLabel } from "@/utils/listingPrice";
import Image from "next/image";
import { useTranslation } from "react-i18next";

/**
 * A listing in a grid — profiles, saved listings and the feed's grid mode.
 * Desktop users compare listings side by side, so the card carries price,
 * place and size, where the app's square tiles only show the photo.
 *
 * Video-only listings get a dark tile with a play mark rather than a frame:
 * drawing a frame means downloading the video, the egress the app avoids too.
 */
export function ListingCard({
  listing,
  viewCount,
  showLifecycle = false,
  className,
}: {
  listing: Listing;
  /** Owner-only: how many times it has been viewed. */
  viewCount?: number | null;
  /** Owner-only: mark expired listings. */
  showLifecycle?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  const photo = listing.media.find((item) => item.kind === "photo");
  const hasVideo = listing.media.some((item) => item.kind === "video") || !!listing.video_url;
  const price = getListingPriceLabel(listing, t);
  const address = getListingAddressLabel(listing);
  const facts = [
    listing.category ? t(`newListing.categories.${listing.category}`) : null,
    listing.surface_m2 != null ? `${listing.surface_m2} m²` : null,
    listing.rooms != null ? `${formatListingMetric(listing.rooms)} ${t("web.listing.roomsShort")}` : null,
  ].filter(Boolean);
  const expired = showLifecycle && isListingExpired(listing);

  return (
    <Link
      href={`/listing/${listing.id}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-3xl bg-surface shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_8px_28px_rgba(0,0,0,0.12)]",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-media-placeholder">
        {photo ? (
          <Image
            src={photo.public_url}
            alt=""
            fill
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 50vw"
            className={cn(
              "object-cover transition-transform duration-300 group-hover:scale-[1.03]",
              expired && "grayscale",
            )}
          />
        ) : hasVideo ? (
          <div className="flex h-full items-center justify-center bg-[#1F1F1F] text-white">
            <PlayFilledIcon width={30} height={30} aria-hidden />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-text-muted">
            {t("common.noMedia")}
          </div>
        )}
        <div className="absolute left-2.5 top-2.5 flex gap-1.5">
          <ListingBadge listing={listing} />
          {expired ? (
            <span className="rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
              {t("listing.expired")}
            </span>
          ) : null}
        </div>
        {viewCount != null ? (
          <span
            className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white"
            aria-label={t("listing.viewsCount", { count: viewCount })}
          >
            <EyeIcon width={11} height={11} aria-hidden />
            {viewCount}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3.5">
        {price ? <p className="font-display text-lg leading-tight text-text">{price}</p> : null}
        {address ? (
          <p className="flex items-center gap-1 truncate text-[13px] text-text-muted">
            <PinIcon width={10} height={12} className="shrink-0" aria-hidden />
            <span className="truncate">{address}</span>
          </p>
        ) : null}
        {facts.length > 0 ? (
          <p className="truncate text-[13px] text-text">{facts.join(" · ")}</p>
        ) : null}
      </div>
    </Link>
  );
}

/** Responsive grid for ListingCards. */
export function ListingGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4", className)}>
      {children}
    </div>
  );
}
