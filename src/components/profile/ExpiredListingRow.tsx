"use client";

import HouseIcon from "@assets/icons/house-icon.svg";
import { buttonClasses } from "@/components/genericComponents/Button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import type { Listing } from "@/types/types";
import { getListingPriceLabel } from "@/utils/listingPrice";
import { formatDayLabel } from "@/utils/relativeTime";
import Image from "next/image";
import { useTranslation } from "react-i18next";

/**
 * One of the owner's expired listings on the profile, with Renew right there
 * — web port of the app's ExpiredListingRow: one click puts it back in the
 * feed for another 30 days. The listing and the button are siblings, not one
 * inside the other (a button inside a link is invalid HTML).
 */
export function ExpiredListingRow({
  listing,
  onReactivate,
  isReactivating,
}: {
  listing: Listing;
  onReactivate: () => void;
  isReactivating: boolean;
}) {
  const { t, i18n } = useTranslation();
  const cover = [...(listing.media ?? [])]
    .filter((media) => media.kind === "photo")
    .sort((a, b) => a.sort_order - b.sort_order)[0]?.public_url;
  const expiredOn = listing.expires_at ? formatDayLabel(listing.expires_at, t, i18n.language) : null;
  const place = [listing.street, listing.municipality || listing.city].filter(Boolean).join(", ");

  return (
    <li className="flex items-center gap-3 rounded-3xl bg-surface p-3">
      <Link
        href={`/listing/${listing.id}`}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl transition-opacity hover:opacity-80"
      >
        <span className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-media-placeholder text-text-muted">
          {cover ? (
            <Image src={cover} alt="" fill sizes="64px" className="object-cover grayscale" />
          ) : (
            <HouseIcon width={22} height={22} aria-hidden />
          )}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-semibold text-text">
            {getListingPriceLabel(listing, t) ?? t("listing.detailsPrice")}
          </span>
          {place ? <span className="truncate text-sm text-text-muted">{place}</span> : null}
          {expiredOn ? (
            <span className="truncate text-xs text-text-muted">{t("profile.expiredOn", { date: expiredOn })}</span>
          ) : null}
        </span>
      </Link>

      <button
        type="button"
        onClick={onReactivate}
        disabled={isReactivating}
        aria-busy={isReactivating}
        className={cn(buttonClasses(), "min-h-[38px] min-w-0 shrink-0 px-4 text-sm")}
      >
        {isReactivating ? (
          <span
            aria-hidden
            className="h-4 w-4 animate-spin rounded-full border-2 border-text-on-primary border-t-transparent"
          />
        ) : null}
        {t("profile.reactivate")}
      </button>
    </li>
  );
}
