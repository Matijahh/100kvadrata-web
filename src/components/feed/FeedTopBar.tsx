"use client";

import FilterIcon from "@assets/icons/filter-icon.svg";
import GlobeIcon from "@assets/icons/globe-icon.svg";
import { cn } from "@/lib/cn";
import { websiteHref } from "@/lib/websiteHref";
import type { AppLanguage } from "@/types/types";
import type { FeedTab } from "@/stores/useFeedStore";
import { useLocale } from "next-intl";
import { useTranslation } from "react-i18next";

/**
 * Above the feed: the filters toggle (expands or collapses the panel on wide
 * screens, opens a sheet on smaller ones) and Properties / Buyers (sellers
 * only, like the app), centred. What is filtered is shown in the panel or
 * sheet itself; here only a count (wide screens) or a filled button (below lg).
 * No free-text search field — the app has none either (its bar only opens
 * the filters).
 */
export function FeedTopBar({
  tab,
  onTabChange,
  showTabs,
  activeFilterCount,
  onToggleFilters,
  filtersExpanded,
}: {
  tab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
  showTabs: boolean;
  /** How many filters are applied (the panel / sheet lists them and clears them). */
  activeFilterCount: number;
  onToggleFilters: () => void;
  /** Wide screens: whether the filter panel is open. Undefined where it opens a sheet. */
  filtersExpanded?: boolean;
}) {
  const { t } = useTranslation();
  // From the route, so the server-rendered link is already right.
  const locale = useLocale() as AppLanguage;
  const filterCount = activeFilterCount;
  const hasActiveFilters = filterCount > 0;

  const tabs = showTabs ? (
    <div role="tablist" aria-label={t("web.feed.tabsLabel")} className="flex shrink-0 rounded-full bg-surface-muted p-1">
      {(["listings", "buyers"] as const).map((value) => (
        <button
          key={value}
          type="button"
          role="tab"
          aria-selected={tab === value}
          onClick={() => onTabChange(value)}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
            tab === value ? "bg-primary text-text-on-primary" : "text-text-muted hover:text-text",
          )}
        >
          {value === "listings" ? t("feed.apartments") : t("feed.buyers")}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <header className="z-10 shrink-0 border-b border-border bg-surface px-4 pb-3 pt-3 md:px-6 md:pt-4">
      {/* Three columns with the tabs in the middle one, so they sit at the
          true centre of the feed area (and stay there as the filter panel
          opens and closes). Every item is placed explicitly:
            below lg (reel): website | tabs | filters
            lg and up (grid): filters | tabs | —   */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 md:gap-3">
        {/* Phones have no rail, so the way back to the website lives here. */}
        <a
          href={websiteHref(locale)}
          aria-label={t("web.nav.website")}
          title={t("web.nav.website")}
          className="col-start-1 row-start-1 flex h-12 w-12 items-center justify-center justify-self-start rounded-full bg-surface-muted text-primary md:hidden"
        >
          <GlobeIcon width={22} height={22} aria-hidden />
        </a>

        <button
          type="button"
          onClick={onToggleFilters}
          aria-label={hasActiveFilters ? `${t("web.feed.filters")} (${filterCount})` : t("web.feed.filters")}
          aria-expanded={filtersExpanded}
          className={cn(
            "col-start-3 row-start-1 flex h-12 items-center gap-2 justify-self-end rounded-full px-3.5 text-sm font-semibold transition-colors sm:px-4",
            "lg:col-start-1 lg:justify-self-start",
            filtersExpanded ? "bg-primary/10 text-primary" : "bg-surface-muted text-text hover:bg-border",
            // Below lg an active filter shows as a filled button; the sheet
            // it opens says which.
            hasActiveFilters && "max-lg:bg-primary max-lg:text-text-on-primary max-lg:hover:bg-primary max-lg:hover:opacity-90",
          )}
        >
          <FilterIcon
            width={20}
            height={20}
            className={cn("text-primary", hasActiveFilters && "max-lg:text-text-on-primary")}
            aria-hidden
          />
          {/* Icon-only on phones: website + tabs + filters share one row. */}
          <span className="hidden sm:inline">{t("web.feed.filters")}</span>
          {hasActiveFilters ? (
            <span className="hidden h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] text-text-on-primary lg:flex">
              {filterCount}
            </span>
          ) : null}
        </button>

        {tabs ? <div className="col-start-2 row-start-1">{tabs}</div> : null}
      </div>
    </header>
  );
}
