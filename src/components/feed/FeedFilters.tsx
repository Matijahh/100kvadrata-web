"use client";

import BookmarkFilledIcon from "@assets/icons/bookmark-icon-filled.svg";
import BookmarkIcon from "@assets/icons/bookmark-icon.svg";
import { CriteriaFields, SectionTitle } from "@/components/criteria/CriteriaFields";
import { PillInput } from "@/components/form/PillInput";
import Button from "@/components/genericComponents/Button";
import { cn } from "@/lib/cn";
import type { BuyerFilters, ListingFilters } from "@/types/types";
import { useTranslation } from "react-i18next";

type FeedFiltersProps = {
  /** Sidebar (xl+) scrolls inside its column; sheet sits in a Modal. */
  variant: "sidebar" | "sheet";
  onApply: () => void;
  onClearAll: () => void;
  onSave: () => void;
  isSaved: boolean;
  /** False while the draft holds nothing worth saving. */
  canSave: boolean;
} & (
  | { kind: "listings"; draft: ListingFilters; onDraftChange: (next: ListingFilters) => void }
  | { kind: "buyers"; draft: BuyerFilters; onDraftChange: (next: BuyerFilters) => void }
);

/**
 * The feed's filters — the app's HomeFilterSheet / BuyersFilterSheet. Edits
 * a draft; nothing reaches the feed until Search, and the bookmark saves the
 * draft as a saved search, exactly like the app.
 */
export function FeedFilters(props: FeedFiltersProps) {
  const { t } = useTranslation();
  const { variant, onApply, onClearAll, onSave, isSaved, canSave } = props;
  // The desktop panel is a narrow column: pairs go one under the other.
  const stacked = variant === "sidebar";
  const BookmarkGlyph = isSaved ? BookmarkFilledIcon : BookmarkIcon;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onApply();
      }}
      className={cn("flex flex-col", variant === "sidebar" && "h-full")}
    >
      <div className="flex items-center justify-between gap-3 pb-3">
        {/* In the sheet the dialog's own title already names it. */}
        {variant === "sidebar" ? (
          <h2 className="font-display text-xl text-text">{t("web.feed.filters")}</h2>
        ) : (
          <p className="font-display text-xl text-text" aria-hidden>
            {t("web.feed.filters")}
          </p>
        )}
        <button
          type="button"
          onClick={onClearAll}
          className="rounded-full px-2 py-1 text-sm font-semibold text-primary hover:bg-surface-muted"
        >
          {t("feed.filterForm.clearAll")}
        </button>
      </div>

      <div className={cn(variant === "sidebar" && "-mx-1 min-h-0 flex-1 overflow-y-auto px-1 pb-4")}>
        {props.kind === "buyers" ? (
          <>
            <SectionTitle>{t("buyers.filterBuyerTitle")}</SectionTitle>
            <PillInput
              value={props.draft.usernameQuery ?? ""}
              onChangeText={(value) => props.onDraftChange({ ...props.draft, usernameQuery: value })}
              placeholder={t("buyers.filterUsernamePlaceholder")}
              aria-label={t("buyers.filterUsernamePlaceholder")}
              autoCapitalize="none"
              autoCorrect="off"
              className="mb-3"
            />
            <CriteriaFields
              value={props.draft}
              onChange={(next) => props.onDraftChange(next)}
              columns={1}
              stacked={stacked}
            />
          </>
        ) : (
          <CriteriaFields
            value={props.draft}
            onChange={(next) => props.onDraftChange(next)}
            columns={1}
            stacked={stacked}
          />
        )}
      </div>

      <div
        className={cn(
          "flex items-center gap-3 border-t border-border bg-surface pt-3",
          variant === "sheet" && "sticky bottom-0 -mx-6 px-6 pb-1 md:-mx-8 md:px-8",
        )}
      >
        <Button type="submit" title={t("feed.searchAction")} fullWidth className="min-w-0 flex-1" />
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          aria-label={t("feed.saveSearchAction")}
          aria-pressed={isSaved}
          title={t("feed.saveSearchAction")}
          className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-primary text-text-on-primary transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <BookmarkGlyph width={18} height={18} aria-hidden />
        </button>
      </div>
    </form>
  );
}
