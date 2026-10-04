"use client";

import CloseIcon from "@assets/icons/close-icon.svg";
import FilterIcon from "@assets/icons/filter-icon.svg";
import GridIcon from "@assets/icons/grid-icon.svg";
import SearchIcon from "@assets/icons/search-icon.svg";
import { cn } from "@/lib/cn";
import type { FeedLayout, FeedTab } from "@/stores/useFeedStore";
import { useTranslation } from "react-i18next";

/**
 * Above the feed: Properties / Buyers (sellers only, like the app), the search
 * field, the active filters as chips, the filters button (below xl, where the
 * sidebar is not shown) and the Reel / Grid switch.
 */
export function FeedTopBar({
  tab,
  onTabChange,
  showTabs,
  searchText,
  onSearchTextChange,
  onSearchSubmit,
  onSearchClear,
  searchPlaceholder,
  chipLabels,
  onClearAll,
  onOpenFilters,
  layout,
  onLayoutChange,
}: {
  tab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
  showTabs: boolean;
  searchText: string;
  onSearchTextChange: (value: string) => void;
  onSearchSubmit: () => void;
  onSearchClear: () => void;
  searchPlaceholder: string;
  chipLabels: string[];
  onClearAll: () => void;
  onOpenFilters: () => void;
  layout: FeedLayout;
  onLayoutChange: (layout: FeedLayout) => void;
}) {
  const { t } = useTranslation();
  const filterCount = chipLabels.length;

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
      <div className="flex items-center gap-2 md:gap-3">
        <div className="hidden md:block">{tabs}</div>

        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            onSearchSubmit();
          }}
          className="relative min-w-0 flex-1 md:max-w-xl"
        >
          <SearchIcon
            width={20}
            height={20}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-placeholder"
            aria-hidden
          />
          <input
            type="search"
            value={searchText}
            onChange={(event) => onSearchTextChange(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={t("web.feed.searchLabel")}
            enterKeyHint="search"
            className="h-12 w-full rounded-full border border-transparent bg-surface-muted pl-11 pr-11 text-[15px] text-text placeholder:text-placeholder focus:border-primary-soft focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {searchText ? (
            <button
              type="button"
              onClick={onSearchClear}
              aria-label={t("web.feed.clearSearch")}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-text-muted hover:bg-surface"
            >
              <CloseIcon width={16} height={16} aria-hidden />
            </button>
          ) : null}
        </form>

        <button
          type="button"
          onClick={onOpenFilters}
          aria-label={t("web.feed.filters")}
          className="relative flex h-12 shrink-0 items-center gap-2 rounded-full bg-surface-muted px-3.5 text-sm font-semibold text-text hover:bg-border xl:hidden"
        >
          <FilterIcon width={20} height={20} className="text-primary" aria-hidden />
          <span className="hidden md:inline">{t("web.feed.filters")}</span>
          {filterCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] text-text-on-primary md:static">
              {filterCount}
            </span>
          ) : null}
        </button>

        {tab === "listings" ? (
          <div
            role="radiogroup"
            aria-label={t("web.feed.layoutLabel")}
            className="flex shrink-0 rounded-full bg-surface-muted p-1 md:ml-auto"
          >
            <LayoutButton
              active={layout === "reel"}
              label={t("web.feed.layoutReel")}
              onClick={() => onLayoutChange("reel")}
              icon={<ReelGlyph />}
            />
            <LayoutButton
              active={layout === "grid"}
              label={t("web.feed.layoutGrid")}
              onClick={() => onLayoutChange("grid")}
              icon={<GridIcon width={18} height={18} aria-hidden />}
            />
          </div>
        ) : null}
      </div>

      {tabs ? <div className="mt-3 flex justify-center md:hidden">{tabs}</div> : null}

      {chipLabels.length > 0 ? (
        <div className="mt-3 flex items-center gap-2">
          <ul className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {chipLabels.map((label) => (
              <li
                key={label}
                className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-[13px] font-semibold text-primary"
              >
                {label}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onClearAll}
            className="shrink-0 rounded-full px-2 py-1 text-[13px] font-semibold text-text-muted hover:text-text"
          >
            {t("feed.filterForm.clearAll")}
          </button>
        </div>
      ) : null}
    </header>
  );
}

function LayoutButton({
  active,
  label,
  onClick,
  icon,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-colors",
        active ? "bg-surface text-primary shadow-sm" : "text-text-muted hover:text-text",
      )}
    >
      {icon}
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}

function ReelGlyph() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <rect x="6" y="2.5" width="12" height="19" rx="3" />
      <path d="m10.5 9.5 4 2.5-4 2.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}
