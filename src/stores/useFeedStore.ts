import { FEED_LAYOUT_STORAGE_KEY } from "@/constants/storageKeys";
import type { BuyerFilters, ListingFilters } from "@/types/types";
import { create } from "zustand";

// Web only. The app keeps its feed state because the Home tab screen stays
// mounted; on the web the feed page unmounts whenever the user opens a
// listing, so what has to survive the round trip — applied filters, the tab,
// where they were — lives here instead (in memory: a reload starts fresh,
// exactly like relaunching the app).

export type FeedTab = "listings" | "buyers";
export type FeedLayout = "reel" | "grid";

type FeedStore = {
  tab: FeedTab;
  layout: FeedLayout;
  /** Applied (not draft) filters, normalised, with the search term folded in. */
  listingFilters: ListingFilters;
  buyerFilters: BuyerFilters;
  /** Which reel card was on screen, and the grid/buyers scroll offsets. */
  reelIndex: number;
  gridScrollTop: number;
  buyersScrollTop: number;
  setTab: (tab: FeedTab) => void;
  setLayout: (layout: FeedLayout) => void;
  hydrateLayout: () => void;
  setListingFilters: (filters: ListingFilters) => void;
  setBuyerFilters: (filters: BuyerFilters) => void;
  setReelIndex: (index: number) => void;
  setGridScrollTop: (top: number) => void;
  setBuyersScrollTop: (top: number) => void;
  /** New results: everything starts from the top again. */
  resetPosition: () => void;
};

const readStoredLayout = (): FeedLayout | null => {
  try {
    const stored = window.localStorage.getItem(FEED_LAYOUT_STORAGE_KEY);
    return stored === "grid" || stored === "reel" ? stored : null;
  } catch {
    return null;
  }
};

export const useFeedStore = create<FeedStore>()((set) => ({
  tab: "listings",
  // Reel first, like the app; the grid is a remembered choice.
  layout: "reel",
  listingFilters: {},
  buyerFilters: {},
  reelIndex: 0,
  gridScrollTop: 0,
  buyersScrollTop: 0,
  setTab: (tab) => set({ tab }),
  setLayout: (layout) => {
    try {
      window.localStorage.setItem(FEED_LAYOUT_STORAGE_KEY, layout);
    } catch {
      // Private mode: the choice just lasts for this visit.
    }
    set({ layout });
  },
  hydrateLayout: () => {
    const stored = readStoredLayout();
    if (stored) set({ layout: stored });
  },
  setListingFilters: (listingFilters) =>
    set({ listingFilters, reelIndex: 0, gridScrollTop: 0 }),
  setBuyerFilters: (buyerFilters) => set({ buyerFilters, buyersScrollTop: 0 }),
  setReelIndex: (reelIndex) => set({ reelIndex }),
  setGridScrollTop: (gridScrollTop) => set({ gridScrollTop }),
  setBuyersScrollTop: (buyersScrollTop) => set({ buyersScrollTop }),
  resetPosition: () => set({ reelIndex: 0, gridScrollTop: 0, buyersScrollTop: 0 }),
}));
