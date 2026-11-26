"use client";

import BookmarkFilledIcon from "@assets/icons/save-icon-filled.svg";
import BookmarkIcon from "@assets/icons/save-icon.svg";
import { CriteriaFields } from "@/components/criteria/CriteriaFields";
import { FilterSection } from "@/components/criteria/FilterSection";
import { ChoiceChips } from "@/components/form/ChoiceChips";
import { PillInput } from "@/components/form/PillInput";
import Button from "@/components/genericComponents/Button";
import { cn } from "@/lib/cn";
import { LISTING_SORT_VALUES, type BuyerFilters, type ListingFilters, type ListingSort } from "@/types/types";
import { useTranslation } from "react-i18next";

type FeedFiltersProps = {
  /** Sidebar (xl+) scrolls inside its column; sheet sits in a Modal. */
  variant: "sidebar" | "sheet";
  onApply: () => void;
  /** Resets the form only; the feed keeps what was applied until Show. */
  onClearDraft: () => void;
  onSave: () => void;
  isSaved: boolean;
  /** False while the draft holds nothing worth saving. */
  canSave: boolean;
} & (
  | { kind: "listings"; draft: ListingFilters; onDraftChange: (next: ListingFilters) => void }
  | { kind: "buyers"; draft: BuyerFilters; onDraftChange: (next: BuyerFilters) => void }
);

/**
 * The feed's filters — the app's FeedFilterSheet: one form for both feeds,
 * grouped into sections that open and close, with the sort on top for
 * listings. Edits a draft; nothing reaches the feed until "Show listings" /
 * "Show buyers", and the bookmark saves the draft as a saved search, exactly
 * like the app.
 */
export function FeedFilters(props: FeedFiltersProps) {
  const { t } = useTranslation();
  const { variant, onApply, onClearDraft, onSave, isSaved, canSave } = props;
  // The desktop panel is a narrow column: pairs go one under the other.
  const stacked = variant === "sidebar";
  const BookmarkGlyph = isSaved ? BookmarkFilledIcon : BookmarkIcon;
  const isListings = props.kind === "listings";

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onApply();
      }}
      className={cn("flex flex-col", variant === "sidebar" && "h-full")}
    >
      {/* In the sheet this row shares the line with the popup's X, so it stops short of it. */}
      <div className={cn("flex items-center justify-between gap-3 pb-1", variant === "sheet" && "pr-10")}>
        {/* In the sheet the dialog's own title already names it. */}
        {variant === "sidebar" ? (
          <h2 className="font-display text-xl text-text">{t("feed.filterButton")}</h2>
        ) : (
          <p className="font-display text-xl text-text" aria-hidden>
            {t("feed.filterButton")}
          </p>
        )}
        <button
          type="button"
          onClick={onClearDraft}
          className="rounded-full px-2 py-1 text-sm font-semibold text-primary hover:bg-surface-muted"
        >
          {t("feed.filterForm.clearAll")}
        </button>
      </div>

      <div className={cn(variant === "sidebar" && "-mx-1 min-h-0 flex-1 overflow-y-auto px-1 pb-4")}>
        {props.kind === "listings" ? (
          <>
            <FilterSection
              title={t("feed.sort.title")}
              activeCount={props.draft.sort && props.draft.sort !== "newest" ? 1 : 0}
              defaultOpen
            >
              <ChoiceChips<ListingSort>
                options={LISTING_SORT_VALUES.map((value) => ({ label: t(`feed.sort.${value}`), value }))}
                value={props.draft.sort ?? "newest"}
                onChange={(value) => props.onDraftChange({ ...props.draft, sort: value })}
                ariaLabel={t("feed.sort.title")}
              />
            </FilterSection>
            <CriteriaFields
              value={props.draft}
              onChange={(next) => props.onDraftChange(next)}
              columns={1}
              stacked={stacked}
              collapsible
              withPriceBasis
            />
          </>
        ) : (
          <>
            <FilterSection
              title={t("buyers.filterBuyerTitle")}
              activeCount={props.draft.usernameQuery?.trim() ? 1 : 0}
              defaultOpen
            >
              <PillInput
                value={props.draft.usernameQuery ?? ""}
                onChangeText={(value) => props.onDraftChange({ ...props.draft, usernameQuery: value })}
                placeholder={t("buyers.filterUsernamePlaceholder")}
                aria-label={t("buyers.filterUsernamePlaceholder")}
                autoCapitalize="none"
                autoCorrect="off"
              />
            </FilterSection>
            <CriteriaFields
              value={props.draft}
              onChange={(next) => props.onDraftChange(next)}
              columns={1}
              stacked={stacked}
              collapsible
            />
          </>
        )}
      </div>

      <div
        className={cn(
          "flex items-center gap-3 border-t border-border bg-surface pt-3",
          variant === "sheet" && "sticky bottom-0 -mx-6 px-6 pb-1 md:-mx-8 md:px-8",
        )}
      >
        <Button
          type="submit"
          title={t(isListings ? "feed.showListings" : "feed.showBuyers")}
          fullWidth
          className="min-w-0 flex-1"
        />
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
