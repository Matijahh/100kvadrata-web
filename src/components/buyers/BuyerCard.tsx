"use client";

import PinIcon from "@assets/icons/pin-icon.svg";
import Avatar from "@/components/genericComponents/Avatar";
import Button from "@/components/genericComponents/Button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { useAuthStore } from "@/stores/useAuthStore";
import type { BuyerProfile, PreferenceCriteria } from "@/types/types";
import {
  formatAmount,
  getRangeLabel,
  PRICE_RANGE_KEYS,
  ROOMS_RANGE_KEYS,
  SURFACE_RANGE_KEYS,
} from "@/utils/rangeLabels";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type Pill = { key: string; label: string };
type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

/**
 * One buyer's preference set on the Buyers feed — web port of the app's
 * BuyerCard: avatar, username, where they are looking, their own words, the
 * criteria as pills, and "Offer property". The app shows one per screen; on
 * the web they sit in a grid, which is how a seller scans a list of people.
 */
export function BuyerCard({ buyer, onOffer }: { buyer: BuyerProfile; onOffer: (buyer: BuyerProfile) => void }) {
  const { t } = useTranslation();
  const sessionUser = useAuthStore((state) => state.sessionUser);
  const profileHref = sessionUser?.id === buyer.id ? "/profile" : `/user/${buyer.id}`;
  const locationLabel = useMemo(() => buildLocationLabel(buyer.preferences), [buyer.preferences]);
  const pills = useMemo(() => buildPreferencePills(buyer.preferences, t), [buyer.preferences, t]);
  // The set's own description says more than the bio, which is about the
  // person rather than this search; the bio fills in when there is none.
  const description = buyer.preferences.description?.trim() || buyer.bio?.trim() || null;
  const [isExpanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const element = descriptionRef.current;
    if (element && !isExpanded) setOverflows(element.scrollHeight > element.clientHeight + 1);
  }, [description, isExpanded]);

  return (
    <article className="relative flex h-full flex-col items-center pt-[60px]">
      <Link
        href={profileHref}
        aria-label={t("buyers.openProfile", { username: buyer.username })}
        className="absolute top-0 z-[1] block h-[120px] w-[120px] overflow-hidden rounded-full border-[3px] border-surface bg-surface-muted shadow-[0_8px_20px_rgba(0,0,0,0.12)]"
      >
        <Avatar userId={buyer.id} avatarUrl={buyer.avatarUrl} />
      </Link>

      <div className="flex w-full flex-1 flex-col items-center rounded-[40px] bg-surface px-6 pb-5 pt-[76px] shadow-[0_12px_18px_rgba(0,0,0,0.06)]">
        <Link href={profileHref} className="max-w-full truncate text-lg font-semibold text-text hover:underline">
          @{buyer.username}
        </Link>
        {locationLabel ? (
          <p className="mt-1 flex max-w-full items-center gap-1.5 text-sm text-text-muted">
            <PinIcon width={11} height={13} className="shrink-0" aria-hidden />
            <span className="truncate">{locationLabel}</span>
          </p>
        ) : null}

        {description ? (
          <div className="mt-4 w-full">
            <p
              ref={descriptionRef}
              className={cn("text-center text-[15px] leading-[22px] text-text", !isExpanded && "line-clamp-2")}
            >
              {description}
            </p>
            {overflows || isExpanded ? (
              <button
                type="button"
                onClick={() => setExpanded((expanded) => !expanded)}
                aria-expanded={isExpanded}
                className="mx-auto mt-1 block text-[13px] font-semibold text-primary hover:underline"
              >
                {isExpanded ? t("preferences.showLess") : t("preferences.showMore")}
              </button>
            ) : null}
          </div>
        ) : null}

        {pills.length > 0 ? (
          <ul className="mt-4 flex flex-wrap justify-center gap-1.5">
            {pills.map((pill) => (
              <li key={pill.key} className="rounded-full bg-surface-muted px-3 py-1 text-[13px] text-text">
                {pill.label}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-auto w-full pt-5">
          <Button title={t("buyers.offerApartment")} onClick={() => onOffer(buyer)} fullWidth />
        </div>
      </div>
    </article>
  );
}

const buildLocationLabel = (preferences: PreferenceCriteria): string | null => {
  const parts = [preferences.city, preferences.municipality, preferences.state]
    .map((value) => value?.trim() ?? "")
    .filter(Boolean);
  return parts.length === 0 ? null : parts.slice(0, 2).join(", ");
};

// Same pills, in the same order, as the app's BuyerCard.
const buildPreferencePills = (preferences: PreferenceCriteria, t: TranslateFn): Pill[] => {
  const pills: Pill[] = [];

  if (preferences.listingType) {
    pills.push({ key: "listingType", label: t(`newListing.listingTypes.${preferences.listingType}`) });
  }
  if (preferences.category) {
    pills.push({ key: "category", label: t(`newListing.categories.${preferences.category}`) });
  }
  if (preferences.city) {
    pills.push({ key: "city", label: preferences.city });
  } else if (preferences.municipality) {
    pills.push({ key: "municipality", label: preferences.municipality });
  } else if (preferences.state) {
    pills.push({ key: "state", label: preferences.state });
  }

  // One pill per range: both ends describe one range, not two facts.
  const ranges: [string, string | null][] = [
    ["price", getRangeLabel(preferences.minPriceEur, preferences.maxPriceEur, PRICE_RANGE_KEYS, t, formatAmount)],
    ["surface", getRangeLabel(preferences.minSurfaceM2, preferences.maxSurfaceM2, SURFACE_RANGE_KEYS, t, formatAmount)],
    ["rooms", getRangeLabel(preferences.minRooms, preferences.maxRooms, ROOMS_RANGE_KEYS, t)],
  ];
  ranges.forEach(([key, label]) => {
    if (label) pills.push({ key, label });
  });

  // "floor" is the "enter a number" option — meaningless as a pill; the
  // number, when there is one, gets its own.
  (preferences.storey ?? []).forEach((value) => {
    if (value !== "floor") pills.push({ key: `storey-${value}`, label: t(`newListing.storeyOptions.${value}`) });
  });
  if (preferences.storeyFloorNumber != null) {
    pills.push({
      key: "floorNumber",
      label: t("feed.filterSummary.floorNumber", { value: preferences.storeyFloorNumber }),
    });
  }

  const multiValuePills: [string, string[] | undefined, string][] = [
    ["constructionType", preferences.constructionType, "constructionTypeOptions"],
    ["propertyCondition", preferences.propertyCondition, "propertyConditionOptions"],
    ["furniture", preferences.furniture, "furnitureOptions"],
    ["orientation", preferences.orientation, "orientations"],
    ["parking", preferences.parking, "parkingOptions"],
    ["groundType", preferences.groundType, "groundOptions"],
    ["heating", preferences.heatingTypes, "heatingOptions"],
    ["nearby", preferences.nearbyObjects, "nearbyObjectOptions"],
    ["feature", preferences.additionalFeatures, "additionalFeatureOptions"],
  ];
  multiValuePills.forEach(([key, values, optionKey]) => {
    (values ?? []).forEach((value) => {
      pills.push({ key: `${key}-${value}`, label: t(`newListing.${optionKey}.${value}`) });
    });
  });

  return pills;
};
