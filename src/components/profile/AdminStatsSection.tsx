"use client";

import { ColumnChart } from "@/components/charts/ColumnChart";
import { type RankedBarItem, RankedBars } from "@/components/charts/RankedBars";
import { SegmentedBar } from "@/components/charts/SegmentedBar";
import { StatTile } from "@/components/charts/StatTile";
import { buttonClasses } from "@/components/genericComponents/Button";
import { EmptyState, Spinner } from "@/components/genericComponents/EmptyState";
import { cn } from "@/lib/cn";
import { queryKeys } from "@/lib/queryKeys";
import { fetchAdminStats } from "@/services/adminStats";
import { useLanguageStore } from "@/stores/useLanguageStore";
import {
  ADMIN_STATS_PERIODS,
  type AdminStats,
  type AdminStatsFlowMetric,
  type AdminStatsPeriod,
  LISTING_TYPE_VALUES,
} from "@/types/types";
import { bucketDays, formatChartBucket, formatChartDay, getBucketSize, getSharePercent } from "@/utils/chartData";
import { formatGrowthTime } from "@/utils/growthMissions";
import { formatAmount } from "@/utils/rangeLabels";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

// Counted again by the database on every call; five minutes is fresh enough
// for a page people glance at, and switching back to a period within that
// shows it at once.
const STALE_TIME = 5 * 60 * 1000;

/**
 * The admin "Statistika" tab — web counterpart of the app's AdminStatsPanel:
 * everything worth watching on the platform for the last 7, 30 or 90 days,
 * from one `admin_stats` call. One period switch at the top scopes every
 * number and chart below it, so they always agree.
 */
export function AdminStatsSection() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<AdminStatsPeriod>(30);

  const statsQuery = useQuery({
    queryKey: queryKeys.adminStats(period),
    queryFn: () => fetchAdminStats(period),
    staleTime: STALE_TIME,
    // A new period keeps the old numbers on screen, faded, until its own
    // arrive, instead of flashing back to a spinner.
    placeholderData: keepPreviousData,
  });
  const stats = statsQuery.data;

  return (
    <div className="flex flex-col gap-3">
      <div role="radiogroup" aria-label={t("adminStats.periodLabel")} className="flex flex-wrap gap-2">
        {ADMIN_STATS_PERIODS.map((days) => {
          const isSelected = days === period;
          return (
            <button
              key={days}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setPeriod(days)}
              className={cn(
                "min-h-9 rounded-full border px-3 text-sm transition-colors",
                isSelected
                  ? "border-primary bg-surface font-semibold text-primary"
                  : "border-border bg-surface-muted text-text hover:bg-surface",
              )}
            >
              {t("adminStats.period", { count: days })}
            </button>
          );
        })}
      </div>

      {stats ? (
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs leading-[18px] text-text-muted">
            {t("adminStats.compared", { count: period })}
            <br />
            {t("adminStats.updatedAt", { time: formatGrowthTime(stats.generatedAt) })}
          </p>
          <button
            type="button"
            onClick={() => void statsQuery.refetch()}
            disabled={statsQuery.isFetching}
            className="rounded py-0.5 text-xs font-semibold text-primary hover:underline disabled:opacity-60"
          >
            {t("adminStats.refresh")}
          </button>
        </div>
      ) : null}

      {statsQuery.isLoading ? (
        <Spinner />
      ) : statsQuery.isError && !stats ? (
        <EmptyState title={t("adminStats.loadError")}>
          <button
            type="button"
            onClick={() => void statsQuery.refetch()}
            disabled={statsQuery.isFetching}
            className={buttonClasses({ variant: "secondary" })}
          >
            {t("common.retry")}
          </button>
        </EmptyState>
      ) : stats ? (
        <div className={cn("transition-opacity", statsQuery.isPlaceholderData && "opacity-50")}>
          <StatsBody stats={stats} />
        </div>
      ) : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6 flex flex-col gap-3">
      <h2 className="font-display text-lg uppercase text-text">{title}</h2>
      {children}
    </section>
  );
}

/**
 * Two to a row below desktop (an odd last one spans the row, like the app),
 * four columns from lg so the tiles line up with the two-column charts.
 */
function Tiles({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 max-lg:[&>*:last-child:nth-child(odd)]:col-span-2">
      {children}
    </div>
  );
}

/** Side by side from lg, so a lone chart takes half the row, not all of it. */
function Charts({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 lg:grid-cols-2">{children}</div>;
}

function ChartCard({ title, caption, children }: { title: string; caption?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-3xl bg-surface p-5">
      <h3 className="text-sm font-semibold text-text">
        {title}
        {caption ? <span className="font-normal text-text-muted">{`  ${caption}`}</span> : null}
      </h3>
      {children}
    </div>
  );
}

function StatsBody({ stats }: { stats: AdminStats }) {
  const { t } = useTranslation();
  const language = useLanguageStore((state) => state.language);
  const bucketSize = getBucketSize(stats.days.length);

  const flowTile = (metric: AdminStatsFlowMetric, label: string) => {
    const flow = stats.flows[metric];
    return (
      <StatTile
        label={label}
        value={formatAmount(flow.current)}
        change={{ current: flow.current, previous: flow.previous, upIsGood: true }}
        trend={flow.series}
      />
    );
  };

  const columnChart = (metric: AdminStatsFlowMetric, title: string, unit: string) => {
    const buckets = bucketDays(stats.days, stats.flows[metric].series, bucketSize);
    return (
      <ChartCard title={title} caption={bucketSize > 1 ? t("adminStats.perWeek") : t("adminStats.perDay")}>
        <ColumnChart
          values={buckets.map((bucket) => bucket.value)}
          barLabels={buckets.map((bucket) => formatChartBucket(bucket, language))}
          unitLabel={unit}
          startLabel={formatChartDay(stats.days[0] ?? "", language)}
          endLabel={formatChartDay(stats.days[stats.days.length - 1] ?? "", language)}
        />
      </ChartCard>
    );
  };

  const cityItems = (counts: AdminStats["liveByCity"], other: number): RankedBarItem[] => [
    ...counts.map((city) => ({ key: city.key, label: city.key, value: city.count })),
    ...(other > 0 ? [{ key: "__other", label: t("adminStats.otherCities"), value: other, isOther: true }] : []),
  ];

  // Always both types, in a fixed order, so each keeps its colour even when
  // one of them has nothing live.
  const typeParts = LISTING_TYPE_VALUES.slice()
    .reverse()
    .map((type) => ({
      key: type,
      label: t(`newListing.listingTypes.${type}`),
      value: stats.liveByType.find((item) => item.key === type)?.count ?? 0,
    }));

  const empty = (text: string) => <p className="text-sm text-text-muted">{text}</p>;

  return (
    <div>
      <Section title={t("adminStats.sections.listings")}>
        <Tiles>
          <StatTile label={t("adminStats.metrics.liveListings")} value={formatAmount(stats.liveListings)} />
          {flowTile("new_listings", t("adminStats.metrics.newListings"))}
          <StatTile
            label={t("adminStats.metrics.freshListings")}
            value={`${getSharePercent(stats.freshListings, stats.liveListings)}%`}
            hint={t("adminStats.ofTotal", {
              part: formatAmount(stats.freshListings),
              total: formatAmount(stats.liveListings),
            })}
          />
          <StatTile label={t("adminStats.metrics.activeAdvertisers")} value={formatAmount(stats.activeAdvertisers)} />
        </Tiles>

        <Charts>
          {columnChart("new_listings", t("adminStats.metrics.newListings"), t("adminStats.units.listings"))}

          <ChartCard title={t("adminStats.breakdowns.byType")}>
            {stats.liveListings > 0 ? <SegmentedBar parts={typeParts} /> : empty(t("adminStats.noLiveListings"))}
          </ChartCard>

          <ChartCard title={t("adminStats.breakdowns.byCity")}>
            {stats.liveByCity.length > 0 ? (
              <RankedBars items={cityItems(stats.liveByCity, stats.liveByCityOther)} />
            ) : (
              empty(t("adminStats.noLiveListings"))
            )}
          </ChartCard>

          {stats.liveByCategory.length > 0 ? (
            <ChartCard title={t("adminStats.breakdowns.byCategory")}>
              <RankedBars
                items={stats.liveByCategory.map((category) => ({
                  key: category.key,
                  label: t(`newListing.categories.${category.key}`, { defaultValue: category.key }),
                  value: category.count,
                }))}
              />
            </ChartCard>
          ) : null}
        </Charts>
      </Section>

      <Section title={t("adminStats.sections.users")}>
        <Tiles>
          <StatTile label={t("adminStats.metrics.totalUsers")} value={formatAmount(stats.totalUsers)} />
          {flowTile("signups", t("adminStats.metrics.signups"))}
          <StatTile
            label={t("adminStats.metrics.activeUsers")}
            value={formatAmount(stats.activeUsers)}
            hint={t("adminStats.shareOfUsers", { share: getSharePercent(stats.activeUsers, stats.totalUsers) })}
          />
        </Tiles>
      </Section>

      <Section title={t("adminStats.sections.demand")}>
        <Tiles>
          <StatTile label={t("adminStats.metrics.buyersTotal")} value={formatAmount(stats.buyersTotal)} />
          {flowTile("buyer_requests", t("adminStats.metrics.buyerRequests"))}
        </Tiles>

        <Charts>
          <ChartCard title={t("adminStats.breakdowns.wantedCities")}>
            {stats.wantedByCity.length > 0 ? (
              <RankedBars items={cityItems(stats.wantedByCity, stats.wantedByCityOther)} />
            ) : (
              empty(t("adminStats.noWantedCities"))
            )}
          </ChartCard>
        </Charts>
      </Section>

      <Section title={t("adminStats.sections.engagement")}>
        <Charts>
          <ChartCard title={t("adminStats.breakdowns.topViewed")}>
            {stats.topViewed.length > 0 ? (
              <RankedBars
                items={stats.topViewed.map((listing) => ({
                  key: String(listing.id),
                  label: [
                    // "Novi Sad", not "Novi Sad, Novi Sad" where the two match.
                    [listing.city, listing.municipality]
                      .filter((part, index, parts) => part && parts.indexOf(part) === index)
                      .join(", "),
                    listing.category
                      ? t(`newListing.categories.${listing.category}`, { defaultValue: listing.category })
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · "),
                  value: listing.views,
                  href: `/listing/${listing.id}`,
                }))}
              />
            ) : (
              empty(t("adminStats.noViews"))
            )}
          </ChartCard>
        </Charts>
      </Section>

      <Section title={t("adminStats.sections.messages")}>
        <Tiles>
          {flowTile("inquiries", t("adminStats.metrics.inquiries"))}
          {flowTile("offers", t("adminStats.metrics.offers"))}
        </Tiles>
      </Section>
    </div>
  );
}
