// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
import { supabase } from "@/lib/supabase";
import {
  ADMIN_STATS_FLOW_METRICS,
  AdminStats,
  AdminStatsCount,
  AdminStatsFlow,
  AdminStatsFlowMetric,
  AdminStatsPeriod,
  AdminStatsTopListing,
  LISTING_CATEGORY_VALUES,
  LISTING_TYPE_VALUES,
  ListingCategory,
  ListingType,
} from "@/types/types";

/**
 * The admin "Statistika" tab, admins only: one call to `admin_stats`, which
 * counts everything again from the data the app already stores. The database
 * refuses anyone who isn't an admin (NOT_ADMIN).
 */

type Row = Record<string, unknown>;

const toCount = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const toText = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const asRows = (value: unknown): Row[] =>
  Array.isArray(value)
    ? value.filter((item): item is Row => !!item && typeof item === "object")
    : [];

const mapCounts = (value: unknown): AdminStatsCount[] =>
  asRows(value)
    .map((row) => ({ key: toText(row.key) ?? "", count: toCount(row.count) }))
    .filter((item) => item.key !== "");

const mapFlow = (value: unknown, dayCount: number): AdminStatsFlow => {
  const row = value && typeof value === "object" ? (value as Row) : {};
  const series = Array.isArray(row.series) ? row.series.map(toCount) : [];

  return {
    current: toCount(row.current),
    previous: toCount(row.previous),
    // Always one value per day, so the charts never have to guard for it.
    series: Array.from({ length: dayCount }, (_, index) => series[index] ?? 0),
  };
};

const isCategory = (value: unknown): value is ListingCategory =>
  (LISTING_CATEGORY_VALUES as readonly unknown[]).includes(value);

const isListingType = (value: unknown): value is ListingType =>
  (LISTING_TYPE_VALUES as readonly unknown[]).includes(value);

const mapTopListing = (row: Row): AdminStatsTopListing => ({
  id: toCount(row.id),
  category: isCategory(row.category) ? row.category : null,
  listingType: isListingType(row.listing_type) ? row.listing_type : null,
  city: toText(row.city),
  municipality: toText(row.municipality),
  views: toCount(row.views),
});

export const fetchAdminStats = async (
  days: AdminStatsPeriod,
): Promise<AdminStats> => {
  const { data } = await supabase
    .rpc("admin_stats", { p_days: days })
    .throwOnError();
  const row = (data ?? {}) as Row;
  const dayList = Array.isArray(row.days)
    ? row.days.filter((day): day is string => typeof day === "string")
    : [];
  const flows = (row.flows && typeof row.flows === "object" ? row.flows : {}) as Row;

  return {
    days: dayList,
    flows: Object.fromEntries(
      ADMIN_STATS_FLOW_METRICS.map((metric) => [
        metric,
        mapFlow(flows[metric], dayList.length),
      ]),
    ) as Record<AdminStatsFlowMetric, AdminStatsFlow>,
    liveListings: toCount(row.live_listings),
    activeAdvertisers: toCount(row.active_advertisers),
    freshListings: toCount(row.fresh_listings),
    totalUsers: toCount(row.total_users),
    activeUsers: toCount(row.active_users),
    buyersTotal: toCount(row.buyers_total),
    liveByType: mapCounts(row.live_by_type),
    liveByCategory: mapCounts(row.live_by_category),
    liveByCity: mapCounts(row.live_by_city),
    liveByCityOther: toCount(row.live_by_city_other),
    wantedByCity: mapCounts(row.wanted_by_city),
    wantedByCityOther: toCount(row.wanted_by_city_other),
    topViewed: asRows(row.top_viewed).map(mapTopListing),
    generatedAt: toText(row.generated_at) ?? new Date().toISOString(),
  };
};
