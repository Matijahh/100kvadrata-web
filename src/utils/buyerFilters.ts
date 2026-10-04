// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
import { BuyerFilters } from "@/types/types";
import { stableSerialize } from "@/utils/listingFilters";
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

export const getBuyerFilterChipLabels = (
  filters: BuyerFilters,
  t: TranslateFn,
) => {
  const normalizedFilters = normalizeBuyerFilters(filters);
  const prioritizedLabels: string[] = [];
  const labels: string[] = [];

  if (normalizedFilters.searchText) {
    labels.push(normalizedFilters.searchText);
  }

  if (normalizedFilters.usernameQuery) {
    labels.push(`@${normalizedFilters.usernameQuery}`);
  }

  if (normalizedFilters.category) {
    labels.push(t(`newListing.categories.${normalizedFilters.category}`));
  }

  if (normalizedFilters.listingType) {
    labels.push(t(`newListing.listingTypes.${normalizedFilters.listingType}`));
  }

  if (normalizedFilters.state) {
    labels.push(normalizedFilters.state);
  }

  if (normalizedFilters.city) {
    labels.push(normalizedFilters.city);
  }

  if (normalizedFilters.municipality) {
    labels.push(normalizedFilters.municipality);
  }

  // Both ends of a pair read as one range, the same way the buyer's own card
  // shows them. These chips summarise what is applied; they are not removed
  // one at a time.
  [
    getRangeLabel(
      normalizedFilters.minPriceEur,
      normalizedFilters.maxPriceEur,
      PRICE_RANGE_KEYS,
      t,
      formatAmount,
    ),
    getRangeLabel(
      normalizedFilters.minSurfaceM2,
      normalizedFilters.maxSurfaceM2,
      SURFACE_RANGE_KEYS,
      t,
      formatAmount,
    ),
    getRangeLabel(
      normalizedFilters.minRooms,
      normalizedFilters.maxRooms,
      ROOMS_RANGE_KEYS,
      t,
    ),
  ].forEach((label) => {
    if (label) {
      prioritizedLabels.push(label);
    }
  });

  if (normalizedFilters.storeyFloorNumber != null) {
    prioritizedLabels.push(
      t("feed.filterSummary.floorNumber", {
        value: normalizedFilters.storeyFloorNumber,
      }),
    );
  }

  // One chip per selected value, the same as heating always was.
  const multiValueLabels: [string[] | undefined, string][] = [
    [normalizedFilters.orientation, "orientations"],
    [normalizedFilters.parking, "parkingOptions"],
    [normalizedFilters.constructionType, "constructionTypeOptions"],
    [normalizedFilters.propertyCondition, "propertyConditionOptions"],
    // "floor" is the form's "Other (enter number)" option, which means
    // nothing as a chip. The floor number chip above stands in for it.
    [
      normalizedFilters.storey?.filter((value) => value !== "floor"),
      "storeyOptions",
    ],
    [normalizedFilters.groundType, "groundOptions"],
    [normalizedFilters.furniture, "furnitureOptions"],
  ];

  multiValueLabels.forEach(([values, optionKey]) => {
    (values ?? []).forEach((value) => {
      labels.push(t(`newListing.${optionKey}.${value}`));
    });
  });

  (normalizedFilters.heatingTypes ?? []).forEach((value) => {
    labels.push(t(`newListing.heatingOptions.${value}`));
  });

  (normalizedFilters.nearbyObjects ?? []).forEach((value) => {
    labels.push(t(`newListing.nearbyObjectOptions.${value}`));
  });

  (normalizedFilters.additionalFeatures ?? []).forEach((value) => {
    labels.push(t(`newListing.additionalFeatureOptions.${value}`));
  });

  return [...prioritizedLabels, ...labels];
};

/**
 * Same job as `getListingFiltersSignature`: a stable string for a filter set,
 * so "have I already saved this?" is a set lookup rather than a deep compare.
 * Separate because the buyer filters have their own normaliser — most notably
 * `usernameQuery`, which the listings side has no idea about.
 */
export const getBuyerFiltersSignature = (filters: BuyerFilters) =>
  stableSerialize(normalizeBuyerFilters(filters));
