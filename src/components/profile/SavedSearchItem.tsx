"use client";

import AnchorRightIcon from "@assets/icons/anchor-right-icon.svg";
import BuildingIcon from "@assets/icons/building-icon.svg";
import TrashIcon from "@assets/icons/trash-icon.svg";
import UserIcon from "@assets/icons/user-icon.svg";
import type { SavedSearch } from "@/types/types";
import { getBuyerFilterChipLabels } from "@/utils/buyerFilters";
import { getListingFilterChipLabels } from "@/utils/listingFilters";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

/**
 * A saved search: an icon for what it finds (places or people — the chips
 * alone cannot tell), its criteria as chips, and delete. Web counterpart of
 * the app's ProfileSavedSearchItem.
 */
export function SavedSearchItem({
  savedSearch,
  onOpen,
  onDelete,
}: {
  savedSearch: SavedSearch;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const isBuyers = savedSearch.kind === "buyers";
  const chips = useMemo(
    () =>
      savedSearch.kind === "buyers"
        ? getBuyerFilterChipLabels(savedSearch.filters, t)
        : getListingFilterChipLabels(savedSearch.filters, t),
    [savedSearch, t],
  );
  const Icon = isBuyers ? UserIcon : BuildingIcon;
  const kindLabel = t(isBuyers ? "profile.savedSearchBuyersKind" : "profile.savedSearchListingsKind");

  return (
    <div className="flex items-center gap-2 border-b border-divider py-2">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`${kindLabel}: ${chips.join(", ")}`}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-2 py-2 text-left hover:bg-surface-muted"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-primary">
          <Icon width={15} height={15} aria-hidden />
        </span>
        <span className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {(chips.length > 0 ? chips : [t("profile.savedSearchUnnamed")]).map((chip) => (
            <span key={chip} className="rounded-full bg-surface-muted px-3 py-1 text-[13px] text-text">
              {chip}
            </span>
          ))}
        </span>
        <AnchorRightIcon width={8} height={13} className="shrink-0 text-placeholder" aria-hidden />
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={t("profile.savedSearchDeleteConfirm")}
        className="rounded-full p-2 text-placeholder hover:bg-surface-muted hover:text-destructive"
      >
        <TrashIcon width={18} height={18} aria-hidden />
      </button>
    </div>
  );
}
