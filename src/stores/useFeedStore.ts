import { FEED_FILTERS_OPEN_STORAGE_KEY } from "@/constants/storageKeys";
import type { BuyerFilters, ListingFilters } from "@/types/types";
import { create } from "zustand";

// Web only. The app keeps its feed state because the Home tab screen stays
// mounted; on the web the feed page unmounts whenever the user opens a
// listing, so what has to survive the round trip — applied filters, the tab,
// where they were — lives here instead (in memory: a reload starts fresh,
// exactly like relaunching the app).
//
// The layout is not a choice: the screen decides (grid on desktop, reel from
// tablets down) — see FeedView.

export type FeedTab = "listings" | "buyers";

type FeedStore = {
  tab: FeedTab;
  /** Desktop filter panel expanded; remembered between visits. */
  isFilterPanelOpen: boolean;
  /** Applied (not draft) filters, normalised, with the search term folded in. */
  listingFilters: ListingFilters;
  buyerFilters: BuyerFilters;
  /** Which reel card was on screen, and the grid/buyers scroll offsets. */
  reelIndex: number;
  gridScrollTop: number;
  buyersScrollTop: number;
  setTab: (tab: FeedTab) => void;
  setFilterPanelOpen: (open: boolean) => void;
  hydrateFilterPanel: () => void;
  setListingFilters: (filters: ListingFilters) => void;
  setBuyerFilters: (filters: BuyerFilters) => void;
  setReelIndex: (index: number) => void;
  setGridScrollTop: (top: number) => void;
  setBuyersScrollTop: (top: number) => void;
};

export const useFeedStore = create<FeedStore>()((set) => ({
  tab: "listings",
  isFilterPanelOpen: true,
  listingFilters: {},
  buyerFilters: {},
  reelIndex: 0,
  gridScrollTop: 0,
  buyersScrollTop: 0,
  setTab: (tab) => set({ tab }),
  setFilterPanelOpen: (isFilterPanelOpen) => {
    try {
      window.localStorage.setItem(FEED_FILTERS_OPEN_STORAGE_KEY, isFilterPanelOpen ? "1" : "0");
    } catch {
      // Private mode: the choice just lasts for this visit.
    }
    set({ isFilterPanelOpen });
  },
  hydrateFilterPanel: () => {
    try {
      const stored = window.localStorage.getItem(FEED_FILTERS_OPEN_STORAGE_KEY);
      if (stored === "0" || stored === "1") set({ isFilterPanelOpen: stored === "1" });
    } catch {
      // Storage blocked: keep the default (open).
    }
  },
  setListingFilters: (listingFilters) =>
    set({ listingFilters, reelIndex: 0, gridScrollTop: 0 }),
  setBuyerFilters: (buyerFilters) => set({ buyerFilters, buyersScrollTop: 0 }),
  setReelIndex: (reelIndex) => set({ reelIndex }),
  setGridScrollTop: (gridScrollTop) => set({ gridScrollTop }),
  setBuyersScrollTop: (buyersScrollTop) => set({ buyersScrollTop }),
}));
