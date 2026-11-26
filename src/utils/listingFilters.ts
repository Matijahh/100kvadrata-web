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
  LISTING_PRICE_BASIS_VALUES,
  LISTING_PROPERTY_CONDITION_VALUES,
  LISTING_SORT_VALUES,
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
  sort: LISTING_SORT_VALUES,
  priceBasis: LISTING_PRICE_BASIS_VALUES,
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

  // Defaults are left out, so a filter set means the same thing whether or not
  // it spells them out: two otherwise identical saved searches must not differ
  // only by an explicit "newest" or "per m²".
  if (normalizedFilters.sort === "newest") {
    delete normalizedFilters.sort;
  }

  if (
    normalizedFilters.priceBasis !== "total" ||
    (normalizedFilters.minPriceEur == null && normalizedFilters.maxPriceEur == null)
  ) {
    delete normalizedFilters.priceBasis;
  }

  return normalizedFilters as ListingFilters;
};

export const getListingFiltersSignature = (filters: ListingFilters) =>
  stableSerialize(normalizeListingFilters(filters));

/** One removable chip: its text, and the filters with it taken away. */
export type FilterChip<F> = {
  key: string;
  label: string;
  without: F;
};

/**
 * The applied filters as chips, each removable on its own. Ranges are one
 * chip (min and max together), and a multi-select gives one chip per value.
 * The sort shows as a chip too when it isn't the default, so a sorted feed
 * always says so.
 */
export const getListingFilterChips = (
  filters: ListingFilters,
  t: TranslateFn,
): FilterChip<ListingFilters>[] => {
  const normalized = normalizeListingFilters(filters);
  const prioritized: FilterChip<ListingFilters>[] = [];
  const rest: FilterChip<ListingFilters>[] = [];

  const without = (patch: Partial<ListingFilters>) =>
    normalizeListingFilters({ ...normalized, ...patch });
  const withoutValue = <K extends keyof ListingFilters>(key: K, value: string) =>
    without({
      [key]: ((normalized[key] as string[] | undefined) ?? []).filter((item) => item !== value),
    } as Partial<ListingFilters>);

  if (normalized.sort) {
    prioritized.push({
      key: "sort",
      label: t(`feed.sort.${normalized.sort}`),
      without: without({ sort: undefined }),
    });
  }

  if (normalized.searchText) {
    rest.push({ key: "searchText", label: normalized.searchText, without: without({ searchText: undefined }) });
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

  // A smaller place is meaningless without the larger one it sits in, so
  // removing a city also removes its municipality.
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

  const multi: [keyof ListingFilters, string][] = [
    ["orientation", "newListing.orientations"],
    ["parking", "newListing.parkingOptions"],
    ["furniture", "newListing.furnitureOptions"],
    ["constructionType", "newListing.constructionTypeOptions"],
    ["propertyCondition", "newListing.propertyConditionOptions"],
    ["storey", "newListing.storeyOptions"],
    ["heatingTypes", "newListing.heatingOptions"],
    ["groundType", "newListing.groundOptions"],
    ["nearbyObjects", "newListing.nearbyObjectOptions"],
    ["additionalFeatures", "newListing.additionalFeatureOptions"],
  ];

  multi.forEach(([key, prefix]) => {
    ((normalized[key] as string[] | undefined) ?? []).forEach((value) => {
      // "floor" is the form's "Other (enter number)" option, which means
      // nothing as a chip. The floor number chip stands in for it.
      if (key === "storey" && value === "floor") {
        return;
      }

      rest.push({ key: `${key}:${value}`, label: t(`${prefix}.${value}`), without: withoutValue(key, value) });
    });
  });

  // A sale's price is per m² unless the filter says total; the chip says
  // which, since "do 2.000 €" means very different things for the two.
  const priceLabel = getRangeLabel(
    normalized.minPriceEur,
    normalized.maxPriceEur,
    PRICE_RANGE_KEYS,
    t,
    formatAmount,
  );
  if (priceLabel) {
    const perSquare = normalized.priceBasis !== "total" && normalized.listingType === "forSale";
    prioritized.push({
      key: "price",
      label: perSquare ? `${priceLabel} ${t("listing.pricePerSquareSuffix")}` : priceLabel,
      without: without({ minPriceEur: undefined, maxPriceEur: undefined, priceBasis: undefined }),
    });
  }

  const surfaceLabel = getRangeLabel(
    normalized.minSurfaceM2,
    normalized.maxSurfaceM2,
    SURFACE_RANGE_KEYS,
    t,
    formatAmount,
  );
  if (surfaceLabel) {
    prioritized.push({
      key: "surface",
      label: surfaceLabel,
      without: without({ minSurfaceM2: undefined, maxSurfaceM2: undefined }),
    });
  }

  const roomsLabel = getRangeLabel(normalized.minRooms, normalized.maxRooms, ROOMS_RANGE_KEYS, t);
  if (roomsLabel) {
    prioritized.push({
      key: "rooms",
      label: roomsLabel,
      without: without({ minRooms: undefined, maxRooms: undefined }),
    });
  }

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

  return [...prioritized, ...rest];
};

/** The chips' text only, for read-only summaries (saved searches). */
export const getListingFilterChipLabels = (filters: ListingFilters, t: TranslateFn) =>
  getListingFilterChips(filters, t).map((chip) => chip.label);

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
