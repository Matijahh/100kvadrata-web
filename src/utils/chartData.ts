// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
import type { AppLanguage } from "@/types/types";

/**
 * Pure chart helpers shared by the app and the web: axis scale, grouping days
 * into weeks, change against the previous period, and short date labels. No
 * drawing here; the app draws with react-native-svg, the web with plain SVG.
 */

// Interval sizes the axis may step by, per power of ten. The axis shows three
// ticks (0, middle, top), so the top is twice one of these.
const NICE_STEPS = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];

/**
 * The top of a count axis: the smallest "round" number at least as big as
 * `max` whose middle tick is a whole number too. 0 → 2, 5 → 6, 14 → 16,
 * 23 → 30, 180 → 200.
 */
export const getNiceAxisTop = (max: number) => {
  if (!Number.isFinite(max) || max <= 0) {
    return 2;
  }

  const half = max / 2;
  const magnitude = 10 ** Math.floor(Math.log10(half));

  for (const step of NICE_STEPS) {
    const interval = step * magnitude;

    if (interval >= half && Number.isInteger(interval)) {
      return interval * 2;
    }
  }

  return Math.ceil(half) * 2;
};

export type ChartBucket = {
  /** First and last day it covers, YYYY-MM-DD. The same day for daily bars. */
  startDay: string;
  endDay: string;
  value: number;
};

/**
 * Groups daily values into buckets of `size` days. The last bucket always ends
 * on the last day (today), so the newest bar is a whole bucket and only the
 * oldest one can be short.
 */
export const bucketDays = (
  days: string[],
  values: number[],
  size: number,
): ChartBucket[] => {
  const step = Math.max(1, Math.floor(size));
  const buckets: ChartBucket[] = [];

  for (let end = days.length; end > 0; end -= step) {
    const start = Math.max(0, end - step);
    let value = 0;

    for (let index = start; index < end; index += 1) {
      value += values[index] ?? 0;
    }

    buckets.unshift({ startDay: days[start], endDay: days[end - 1], value });
  }

  return buckets;
};

/** Days per bar: one bar a day up to a month, one a week beyond. */
export const getBucketSize = (dayCount: number) => (dayCount > 31 ? 7 : 1);

/**
 * Change against the previous period in whole percent: 12 for +12 %. Null when
 * there was nothing before to compare with (a rise from zero has no
 * percentage); 0 when both are zero.
 */
export const getPercentChange = (current: number, previous: number) => {
  if (previous <= 0) {
    return current <= 0 ? 0 : null;
  }

  return Math.round(((current - previous) / previous) * 100);
};

/** Whole-percent share, 0 when there is no whole. */
export const getSharePercent = (part: number, whole: number) =>
  whole > 0 ? Math.round((part / whole) * 100) : 0;

const EN_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const parseDay = (day: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  return match ? { month: Number(match[2]), date: Number(match[3]) } : null;
};

/** "24. 11." in Serbian, "24 Nov" in English. */
export const formatChartDay = (day: string, language: AppLanguage) => {
  const parsed = parseDay(day);

  if (!parsed) {
    return day;
  }

  return language === "en"
    ? `${parsed.date} ${EN_MONTHS[parsed.month - 1]}`
    : `${parsed.date}. ${parsed.month}.`;
};

/** A bucket's label: one day, or "18. 11. – 24. 11." for a week. */
export const formatChartBucket = (bucket: ChartBucket, language: AppLanguage) =>
  bucket.startDay === bucket.endDay
    ? formatChartDay(bucket.startDay, language)
    : `${formatChartDay(bucket.startDay, language)} – ${formatChartDay(bucket.endDay, language)}`;
