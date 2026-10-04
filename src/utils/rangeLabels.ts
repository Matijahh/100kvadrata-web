// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

type RangeLabelKeys = {
  /** Both ends set and different. Receives {{min}} and {{max}}. */
  range: string;
  /** Both ends set and equal. Receives {{value}}, or {{count}} when plural. */
  exact: string;
  /** Only the low end. Receives {{value}}. */
  min: string;
  /** Only the high end. Receives {{value}}. */
  max: string;
  /**
   * True when `exact` has plural forms and should be given a count instead of
   * a value. Passing a count to a key with no plural forms makes i18next look
   * for variants that do not exist, so this is opt-in rather than always on.
   */
  pluralExact?: boolean;
};

/**
 * Thousands separator, written the Serbian way: 1.200, not 1,200. No unit —
 * every label below carries its own, once, at the end.
 */
export const formatAmount = (value: number) =>
  value >= 1000 ? Math.round(value).toLocaleString("de-DE") : String(value);

/**
 * One label for a min/max pair.
 *
 * A buyer who filled in both ends used to get two chips that plainly belonged
 * together — "Min 250 €" beside "Max 500 €" — eating two slots in a row that
 * only shows a handful. Both ends set is a range and reads as one: "250 - 500 €".
 * One end set is unchanged.
 *
 * Returns null when the pair is empty, so callers can push the result without
 * repeating the check.
 */
export const getRangeLabel = (
  min: number | null | undefined,
  max: number | null | undefined,
  keys: RangeLabelKeys,
  t: TranslateFn,
  format: (value: number) => string = String,
): string | null => {
  if (min == null && max == null) {
    return null;
  }

  if (min == null) {
    return t(keys.max, { value: format(max!) });
  }

  if (max == null) {
    return t(keys.min, { value: format(min) });
  }

  // Typed the wrong way round: they meant a range, so read it low to high
  // rather than printing something backwards.
  const low = Math.min(min, max);
  const high = Math.max(min, max);

  if (low === high) {
    return keys.pluralExact
      ? t(keys.exact, { count: low })
      : t(keys.exact, { value: format(low) });
  }

  return t(keys.range, { min: format(low), max: format(high) });
};

export const PRICE_RANGE_KEYS: RangeLabelKeys = {
  range: "feed.filterSummary.priceRange",
  exact: "feed.filterSummary.priceExact",
  min: "feed.filterSummary.minPrice",
  max: "feed.filterSummary.maxPrice",
};

export const SURFACE_RANGE_KEYS: RangeLabelKeys = {
  range: "feed.filterSummary.surfaceRange",
  exact: "feed.filterSummary.surfaceExact",
  min: "feed.filterSummary.minSurface",
  max: "feed.filterSummary.maxSurface",
};

export const ROOMS_RANGE_KEYS: RangeLabelKeys = {
  range: "feed.filterSummary.roomsRange",
  exact: "feed.filterSummary.roomsExact",
  min: "feed.filterSummary.minRooms",
  max: "feed.filterSummary.maxRooms",
  // "1 soba" but "3 sobe" — the one place a count changes the word.
  pluralExact: true,
};
