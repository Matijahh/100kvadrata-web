// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
import { BuyerFilters } from "@/types/types";
import { FilterChip, stableSerialize } from "@/utils/listingFilters";
import {
  formatAmount,
  getRangeLabel,
  PRICE_RANGE_KEYS,
  ROOMS_RANGE_KEYS,
  SURFACE_RANGE_KEYS,
} from "@/utils/rangeLabels";


type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

export const normalizeBuyerFilters = (filters: BuyerFilters): BuyerFilters => {
  const normalizedFilters: Record<string, unknown> = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (value == null) {
      return;
    }

    if (typeof value === "string") {
      const trimmedValue = value.trim();

      if (!trimmedValue) {
        return;
      }

      normalizedFilters[key] = trimmedValue;
      return;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return;
      }

      normalizedFilters[key] = [...value].sort();
      return;
    }

    normalizedFilters[key] = value;
  });

  return normalizedFilters as BuyerFilters;
};

/**
 * The applied buyer filters as chips, each removable on its own; see
 * getListingFilterChips. Ranges are one chip, multi-selects one per value.
 */
export const getBuyerFilterChips = (
  filters: BuyerFilters,
  t: TranslateFn,
): FilterChip<BuyerFilters>[] => {
  const normalized = normalizeBuyerFilters(filters);
  const prioritized: FilterChip<BuyerFilters>[] = [];
  const rest: FilterChip<BuyerFilters>[] = [];

  const without = (patch: Partial<BuyerFilters>) =>
    normalizeBuyerFilters({ ...normalized, ...patch });

  if (normalized.searchText) {
    rest.push({ key: "searchText", label: normalized.searchText, without: without({ searchText: undefined }) });
  }

  if (normalized.usernameQuery) {
    rest.push({
      key: "usernameQuery",
      label: `@${normalized.usernameQuery}`,
      without: without({ usernameQuery: undefined }),
    });
  }

  if (normalized.category) {
    rest.push({
      key: "category",
      label: t(`newListing.categories.${normalized.category}`),
      without: without({ category: undefined }),
    });
  }

  if (normalized.listingType) {
    rest.push({
      key: "listingType",
      label: t(`newListing.listingTypes.${normalized.listingType}`),
      without: without({ listingType: undefined }),
    });
  }

  if (normalized.state) {
    rest.push({
      key: "state",
      label: normalized.state,
      without: without({ state: undefined, city: undefined, municipality: undefined }),
    });
  }

  if (normalized.city) {
    rest.push({
      key: "city",
      label: normalized.city,
      without: without({ city: undefined, municipality: undefined }),
    });
  }

  if (normalized.municipality) {
    rest.push({
      key: "municipality",
      label: normalized.municipality,
      without: without({ municipality: undefined }),
    });
  }

  const ranges: [string, string | null, Partial<BuyerFilters>][] = [
    [
      "price",
      getRangeLabel(normalized.minPriceEur, normalized.maxPriceEur, PRICE_RANGE_KEYS, t, formatAmount),
      { minPriceEur: undefined, maxPriceEur: undefined },
    ],
    [
      "surface",
      getRangeLabel(normalized.minSurfaceM2, normalized.maxSurfaceM2, SURFACE_RANGE_KEYS, t, formatAmount),
      { minSurfaceM2: undefined, maxSurfaceM2: undefined },
    ],
    [
      "rooms",
      getRangeLabel(normalized.minRooms, normalized.maxRooms, ROOMS_RANGE_KEYS, t),
      { minRooms: undefined, maxRooms: undefined },
    ],
  ];
  ranges.forEach(([key, label, patch]) => {
    if (label) {
      prioritized.push({ key, label, without: without(patch) });
    }
  });

  if (normalized.storeyFloorNumber != null) {
    prioritized.push({
      key: "storeyFloorNumber",
      label: t("feed.filterSummary.floorNumber", { value: normalized.storeyFloorNumber }),
      without: without({
        storeyFloorNumber: undefined,
        storey: (normalized.storey ?? []).filter((value) => value !== "floor"),
      }),
    });
  }

  const multi: [keyof BuyerFilters, string][] = [
    ["orientation", "orientations"],
    ["parking", "parkingOptions"],
    ["constructionType", "constructionTypeOptions"],
    ["propertyCondition", "propertyConditionOptions"],
    ["storey", "storeyOptions"],
    ["groundType", "groundOptions"],
    ["furniture", "furnitureOptions"],
    ["heatingTypes", "heatingOptions"],
    ["nearbyObjects", "nearbyObjectOptions"],
    ["additionalFeatures", "additionalFeatureOptions"],
  ];

  multi.forEach(([key, optionKey]) => {
    const values = (normalized[key] as string[] | undefined) ?? [];
    values.forEach((value) => {
      // "floor" is "Other (enter number)"; the floor number chip stands in.
      if (key === "storey" && value === "floor") {
        return;
      }

      rest.push({
        key: `${key}:${value}`,
        label: t(`newListing.${optionKey}.${value}`),
        without: without({
          [key]: values.filter((item) => item !== value),
        } as Partial<BuyerFilters>),
      });
    });
  });

  return [...prioritized, ...rest];
};

/** The chips' text only, for read-only summaries (saved searches). */
export const getBuyerFilterChipLabels = (filters: BuyerFilters, t: TranslateFn) =>
  getBuyerFilterChips(filters, t).map((chip) => chip.label);

/**
 * Same job as `getListingFiltersSignature`: a stable string for a filter set,
 * so "have I already saved this?" is a set lookup rather than a deep compare.
 * Separate because the buyer filters have their own normaliser — most notably
 * `usernameQuery`, which the listings side has no idea about.
 */
export const getBuyerFiltersSignature = (filters: BuyerFilters) =>
  stableSerialize(normalizeBuyerFilters(filters));
