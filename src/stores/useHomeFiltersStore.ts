// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
import { BuyerFilters, ListingFilters } from "@/types/types";
import { create } from "zustand";

/**
 * A saved search handed from the profile to the home screen, which reads it on
 * focus and applies it.
 *
 * The kind travels with the filters because it decides which feed to land on:
 * the same criteria describe places on one and people on the other, and the
 * filters alone cannot say which was meant.
 */
export type PendingSavedSearch =
  | { kind: "listings"; filters: ListingFilters }
  | { kind: "buyers"; filters: BuyerFilters };

type HomeFiltersStore = {
  pendingSavedSearch: PendingSavedSearch | null;
  setPendingSavedSearch: (pending: PendingSavedSearch | null) => void;
  clearPendingSavedSearch: () => void;
};

export const useHomeFiltersStore = create<HomeFiltersStore>()((set) => ({
  pendingSavedSearch: null,
  setPendingSavedSearch: (pending) => set({ pendingSavedSearch: pending }),
  clearPendingSavedSearch: () => set({ pendingSavedSearch: null }),
}));
