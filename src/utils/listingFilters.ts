// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
import {
  LISTING_ADDITIONAL_FEATURE_VALUES,
  LISTING_CATEGORY_VALUES,
  LISTING_CONSTRUCTION_TYPE_VALUES,
  LISTING_FURNITURE_VALUES,
  LISTING_GROUND_VALUES,
  LISTING_HEATING_VALUES,
  LISTING_NEARBY_OBJECT_VALUES,
  LISTING_ORIENTATION_VALUES,
  LISTING_PARKING_VALUES,
  LISTING_PROPERTY_CONDITION_VALUES,
  LISTING_STOREY_VALUES,
  LISTING_TYPE_VALUES,
  ListingFilters,
} from "@/types/types";
import {
  formatAmount,
  getRangeLabel,
  PRICE_RANGE_KEYS,
  ROOMS_RANGE_KEYS,
  SURFACE_RANGE_KEYS,
} from "@/utils/rangeLabels";

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

// Saved searches are stored as whatever the filter sheet held at the time, so a
// search saved before an option set changed can still name a value the app no
// longer has. Left alone it would quietly match nothing, so retired values are
// dropped here — on the read path as well as the write one. Free-text keys
// (location, search term) are deliberately absent: anything goes there.
const ALLOWED_FILTER_VALUES: Partial<Record<keyof ListingFilters, readonly string[]>> = {
  category: LISTING_CATEGORY_VALUES,
  listingType: LISTING_TYPE_VALUES,
  orientation: LISTING_ORIENTATION_VALUES,
  parking: LISTING_PARKING_VALUES,
  constructionType: LISTING_CONSTRUCTION_TYPE_VALUES,
  propertyCondition: LISTING_PROPERTY_CONDITION_VALUES,
  storey: LISTING_STOREY_VALUES,
  heatingTypes: LISTING_HEATING_VALUES,
  groundType: LISTING_GROUND_VALUES,
  furniture: LISTING_FURNITURE_VALUES,
  nearbyObjects: LISTING_NEARBY_OBJECT_VALUES,
  additionalFeatures: LISTING_ADDITIONAL_FEATURE_VALUES,
};

// The criteria that used to hold one value and now hold several. A saved
// search or a preference set written before that change still has a bare string in
// these, so it is widened to a one-element array on read — otherwise the old
// search would match nothing at all, silently, the first time it was opened.
const MULTI_VALUE_FILTER_KEYS = new Set<keyof ListingFilters>([
  "orientation",
  "parking",
  "constructionType",
  "propertyCondition",
  "storey",
  "heatingTypes",
  "groundType",
  "furniture",
  "nearbyObjects",
  "additionalFeatures",
]);

export const normalizeListingFilters = (filters: ListingFilters): ListingFilters => {
  const normalizedFilters: Record<string, unknown> = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (value == null) {
      return;
    }

    const filterKey = key as keyof ListingFilters;
    const allowedValues = ALLOWED_FILTER_VALUES[filterKey];

    if (typeof value === "string") {
      const trimmedValue = value.trim();

      if (!trimmedValue) {
        return;
      }

      if (allowedValues && !allowedValues.includes(trimmedValue)) {
        return;
      }

      normalizedFilters[key] = MULTI_VALUE_FILTER_KEYS.has(filterKey)
        ? [trimmedValue]
        : trimmedValue;
      return;
    }

    if (Array.isArray(value)) {
      const keptValues = allowedValues
        ? value.filter((item) => allowedValues.includes(item))
        : value;

      if (keptValues.length === 0) {
        return;
      }

      normalizedFilters[key] = [...keptValues].sort();
      return;
    }

    normalizedFilters[key] = value;
  });

  return normalizedFilters as ListingFilters;
};

export const getListingFiltersSignature = (filters: ListingFilters) =>
  stableSerialize(normalizeListingFilters(filters));

export const getListingFilterChipLabels = (
  filters: ListingFilters,
  t: TranslateFn,
) => {
  const normalizedFilters = normalizeListingFilters(filters);
  const prioritizedLabels: string[] = [];
  const labels: string[] = [];

  if (normalizedFilters.searchText) {
    labels.push(normalizedFilters.searchText);
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

  // One chip per selected value: two orientations are two chips, the same way
  // two heating types always were.
  (normalizedFilters.orientation ?? []).forEach((value) => {
    labels.push(t(`newListing.orientations.${value}`));
  });

  (normalizedFilters.parking ?? []).forEach((value) => {
    labels.push(t(`newListing.parkingOptions.${value}`));
  });

  (normalizedFilters.furniture ?? []).forEach((value) => {
    labels.push(t(`newListing.furnitureOptions.${value}`));
  });

  (normalizedFilters.constructionType ?? []).forEach((value) => {
    labels.push(t(`newListing.constructionTypeOptions.${value}`));
  });

  (normalizedFilters.propertyCondition ?? []).forEach((value) => {
    labels.push(t(`newListing.propertyConditionOptions.${value}`));
  });

  // "floor" is the form's "Other (enter number)" option, which means nothing
  // as a chip. The floor number chip below stands in for it.
  (normalizedFilters.storey ?? []).forEach((value) => {
    if (value !== "floor") {
      labels.push(t(`newListing.storeyOptions.${value}`));
    }
  });

  (normalizedFilters.heatingTypes ?? []).forEach((value) => {
    labels.push(t(`newListing.heatingOptions.${value}`));
  });

  (normalizedFilters.groundType ?? []).forEach((value) => {
    labels.push(t(`newListing.groundOptions.${value}`));
  });

  // Both ends of a pair read as one range. These chips are a read-only
  // summary, so nothing is lost by merging them — unlike the home filter
  // summary, where each chip has to stay separately removable.
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

  (normalizedFilters.nearbyObjects ?? []).forEach((value) => {
    labels.push(t(`newListing.nearbyObjectOptions.${value}`));
  });

  (normalizedFilters.additionalFeatures ?? []).forEach((value) => {
    labels.push(t(`newListing.additionalFeatureOptions.${value}`));
  });

  return [...prioritizedLabels, ...labels];
};

export const stableSerialize = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([firstKey], [secondKey]) => firstKey.localeCompare(secondKey))
      .map(([key, nestedValue]) => `${JSON.stringify(key)}:${stableSerialize(nestedValue)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
};
