"use client";

import CloseIcon from "@assets/icons/close-icon.svg";
import FilterIcon from "@assets/icons/filter-icon.svg";
import GlobeIcon from "@assets/icons/globe-icon.svg";
import { cn } from "@/lib/cn";
import { websiteHref } from "@/lib/websiteHref";
import type { AppLanguage } from "@/types/types";
import type { FeedTab } from "@/stores/useFeedStore";
import { useLocale } from "next-intl";
import { useTranslation } from "react-i18next";

export type RemovableChip = {
  key: string;
  label: string;
  onRemove: () => void;
};

/**
 * Above the feed: the Filters button (expands or collapses the panel on wide
 * screens, opens a sheet on smaller ones) with how many filters are applied,
 * Properties / Buyers (every signed-in account, like the app), centred, and
 * the applied filters as chips — each removed with one click, which applies
 * straight away, like the app's HomeSearchBar. No free-text search field: the
 * app has none either.
 */
export function FeedTopBar({
  tab,
  onTabChange,
  showTabs,
  chips,
  onToggleFilters,
  filtersExpanded,
}: {
  tab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
  showTabs: boolean;
  /** The applied filters, each removable on its own. */
  chips: RemovableChip[];
  onToggleFilters: () => void;
  /** Wide screens: whether the filter panel is open. Undefined where it opens a sheet. */
  filtersExpanded?: boolean;
}) {
  const { t } = useTranslation();
  // From the route, so the server-rendered link is already right.
  const locale = useLocale() as AppLanguage;
  const filterCount = chips.length;
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
          aria-label={
            hasActiveFilters ? t("feed.filterButtonActive", { count: filterCount }) : t("feed.filterButton")
          }
          aria-expanded={filtersExpanded}
          className={cn(
            "col-start-3 row-start-1 flex h-12 items-center gap-2 justify-self-end rounded-full px-3.5 text-sm font-semibold transition-colors sm:px-4",
            "lg:col-start-1 lg:justify-self-start",
            filtersExpanded ? "bg-primary/10 text-primary" : "bg-surface-muted text-text hover:bg-border",
          )}
        >
          <FilterIcon width={20} height={20} className="text-primary" aria-hidden />
          {/* Icon-only on phones: website + tabs + filters share one row. */}
          <span className="hidden sm:inline">{t("feed.filterButton")}</span>
          {hasActiveFilters ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] text-text-on-primary">
              {filterCount}
            </span>
          ) : null}
        </button>

        {tabs ? <div className="col-start-2 row-start-1">{tabs}</div> : null}
      </div>

      {hasActiveFilters ? (
        <ul
          className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:-mx-6 md:flex-wrap md:px-6 [&::-webkit-scrollbar]:hidden"
          aria-label={t("feed.filterButtonActive", { count: filterCount })}
        >
          {chips.map((chip) => (
            <li key={chip.key} className="shrink-0">
              <button
                type="button"
                onClick={chip.onRemove}
                aria-label={t("feed.removeFilter", { label: chip.label })}
                title={t("feed.removeFilter", { label: chip.label })}
                className="flex min-h-8 items-center gap-1.5 rounded-full border border-border bg-surface-muted py-1 pl-3 pr-2.5 text-[13px] text-text transition-colors hover:border-primary"
              >
                <span className="whitespace-nowrap">{chip.label}</span>
                <CloseIcon width={12} height={12} className="text-text-muted" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </header>
  );
}
