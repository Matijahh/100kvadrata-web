"use client";

import NoListingsIllustration from "@assets/illustrations/no-listings.svg";
import { BuyersFeed } from "@/components/buyers/BuyersFeed";
import { OfferListingDialog } from "@/components/buyers/OfferListingDialog";
import { FeedFilters } from "@/components/feed/FeedFilters";
import { FeedTopBar } from "@/components/feed/FeedTopBar";
import { ListingFeedGrid } from "@/components/feed/ListingFeedGrid";
import { ListingReel } from "@/components/feed/ListingReel";
import { Spinner } from "@/components/genericComponents/EmptyState";
import { useToast } from "@/components/providers/ToastProvider";
import { Modal } from "@/components/ui/Modal";
import { FEED_HOME_EVENT } from "@/constants/events";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/cn";
import { queryKeys } from "@/lib/queryKeys";
import { fetchBuyers } from "@/services/buyers";
import { fetchListings } from "@/services/listings";
import { fetchBlockedUserIds } from "@/services/reports";
import { createSavedSearch, fetchSavedSearches } from "@/services/savedSearches";
import { useAuthStore } from "@/stores/useAuthStore";
import { useFeedStore, type FeedTab } from "@/stores/useFeedStore";
import { useHomeFiltersStore } from "@/stores/useHomeFiltersStore";
import { useSignInPromptStore } from "@/stores/useSignInPromptStore";
import type { BuyerFilters, BuyerProfile, ListingFilters, SavedSearch } from "@/types/types";
import {
  getBuyerFilterChipLabels,
  getBuyerFiltersSignature,
  normalizeBuyerFilters,
} from "@/utils/buyerFilters";
import {
  getListingFilterChipLabels,
  getListingFiltersSignature,
  normalizeListingFilters,
} from "@/utils/listingFilters";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

// Bigger pages than the app's 3: the grid shows a dozen cards at once, and
// one request per eight reel cards is still cheap.
const PAGE_SIZE = 8;

type PageParam = { limit: number; cursorRank?: number; cursorId?: number };

const omitSearch = <T extends { searchText?: string }>(filters: T): T => {
  const { searchText: _searchText, ...rest } = filters;
  return rest as T;
};

/** Signs a saved search by the rules of the feed it belongs to. */
const savedSearchSignature = (savedSearch: SavedSearch) =>
  savedSearch.kind === "buyers"
    ? getBuyerFiltersSignature(savedSearch.filters)
    : getListingFiltersSignature(savedSearch.filters);

/**
 * The web app's home — port of the app's HomeScreen (tabs/index.tsx): the
 * listings feed (reel first, grid as a remembered choice) and, for selling
 * accounts, the Buyers feed; search, filters and saved searches with the
 * app's exact semantics (draft → Search applies; the bookmark saves the
 * draft). Desktop adds a permanent filter sidebar from xl up.
 */
export function FeedView() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { sessionUser, currentUser, isLoadingProfile } = useCurrentUser();
  const isAuthReady = useAuthStore((state) => state.isReady);
  const promptSignIn = useSignInPromptStore((state) => state.promptSignIn);
  const pendingSavedSearch = useHomeFiltersStore((state) => state.pendingSavedSearch);
  const clearPendingSavedSearch = useHomeFiltersStore((state) => state.clearPendingSavedSearch);
  // The screen decides the layout — no switch: a grid from 1024px (desktop,
  // iPad landscape), the reel below it (tablets in portrait, phones).
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  // From xl the filters are a collapsible panel beside the grid; below, a sheet.
  const isXl = useMediaQuery("(min-width: 1280px)");

  const tab = useFeedStore((state) => state.tab);
  const isFilterPanelOpen = useFeedStore((state) => state.isFilterPanelOpen);
  const listingFilters = useFeedStore((state) => state.listingFilters);
  const buyerFilters = useFeedStore((state) => state.buyerFilters);
  const setTab = useFeedStore((state) => state.setTab);
  const setFilterPanelOpen = useFeedStore((state) => state.setFilterPanelOpen);
  const hydrateFilterPanel = useFeedStore((state) => state.hydrateFilterPanel);
  const setListingFilters = useFeedStore((state) => state.setListingFilters);
  const setBuyerFilters = useFeedStore((state) => state.setBuyerFilters);
  const setReelIndex = useFeedStore((state) => state.setReelIndex);
  const setGridScrollTop = useFeedStore((state) => state.setGridScrollTop);
  const setBuyersScrollTop = useFeedStore((state) => state.setBuyersScrollTop);

  const isBuyersTab = tab === "buyers";
  const [draftSearch, setDraftSearch] = useState(
    () => (isBuyersTab ? buyerFilters.searchText : listingFilters.searchText) ?? "",
  );
  const [draftListing, setDraftListing] = useState<ListingFilters>(() => omitSearch(listingFilters));
  const [draftBuyer, setDraftBuyer] = useState<BuyerFilters>(() => omitSearch(buyerFilters));
  const [isFiltersOpen, setFiltersOpen] = useState(false);
  const [offerBuyer, setOfferBuyer] = useState<BuyerProfile | null>(null);
  const [recentlySavedSignature, setRecentlySavedSignature] = useState<string | null>(null);
  const [scrollToTopSignal, setScrollToTopSignal] = useState(0);

  // The panel slides open and shut when the user toggles it — never on load,
  // when the remembered state replaces the server-rendered default. (The
  // transition is switched on in the same render as the first toggle, which
  // is enough for the browser to animate that change.)
  const [animatePanel, setAnimatePanel] = useState(false);
  useEffect(() => {
    hydrateFilterPanel();
  }, [hydrateFilterPanel]);
  const togglePanel = (open: boolean) => {
    setAnimatePanel(true);
    setFilterPanelOpen(open);
  };

  // The drafts follow whatever gets applied — Search, Clear all, a saved
  // search opened from the profile.
  useEffect(() => {
    setDraftListing(omitSearch(listingFilters));
    if (useFeedStore.getState().tab === "listings") setDraftSearch(listingFilters.searchText ?? "");
  }, [listingFilters]);

  useEffect(() => {
    setDraftBuyer(omitSearch(buyerFilters));
    if (useFeedStore.getState().tab === "buyers") setDraftSearch(buyerFilters.searchText ?? "");
  }, [buyerFilters]);

  // A saved search knows which feed it came from, so it lands on that feed.
  useEffect(() => {
    if (!pendingSavedSearch) return;

    if (pendingSavedSearch.kind === "buyers") {
      const next = normalizeBuyerFilters(pendingSavedSearch.filters);
      setTab("buyers");
      setBuyerFilters(next);
      setDraftSearch(next.searchText ?? "");
    } else {
      const next = normalizeListingFilters(pendingSavedSearch.filters);
      setTab("listings");
      setListingFilters(next);
      setDraftSearch(next.searchText ?? "");
    }
    clearPendingSavedSearch();
  }, [pendingSavedSearch, clearPendingSavedSearch, setTab, setBuyerFilters, setListingFilters]);

  // The Buyers tab is a seller-side tool, gated on the account type alone
  // (with or without a live listing), exactly like the app.
  const canUseBuyersTab = !!sessionUser && currentUser?.accountType === "seller";
  const isBuyersGateSettled = isAuthReady && !isLoadingProfile;

  useEffect(() => {
    if (isBuyersTab && !canUseBuyersTab && isBuyersGateSettled) setTab("listings");
  }, [isBuyersTab, canUseBuyersTab, isBuyersGateSettled, setTab]);

  const feedQuery = useInfiniteQuery({
    queryKey: queryKeys.listingFeed(listingFilters),
    queryFn: ({ pageParam }) => fetchListings({ ...pageParam, filters: listingFilters }),
    initialPageParam: { limit: PAGE_SIZE } as PageParam,
    getNextPageParam: (lastPage): PageParam | undefined => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      const last = lastPage[lastPage.length - 1];
      return { limit: PAGE_SIZE, cursorRank: last.priority_rank ?? 0, cursorId: last.id };
    },
    enabled: !isBuyersTab,
  });

  const blockedUserIdsQuery = useQuery({
    queryKey: sessionUser ? queryKeys.blockedUserIds(sessionUser.id) : ["blockedUserIds", "guest"],
    queryFn: () => fetchBlockedUserIds(sessionUser!.id),
    enabled: !!sessionUser,
  });
  const blockedUserIds = useMemo(() => new Set(blockedUserIdsQuery.data ?? []), [blockedUserIdsQuery.data]);

  const listings = useMemo(
    () => (feedQuery.data?.pages.flat() ?? []).filter((listing) => !blockedUserIds.has(listing.user_id)),
    [feedQuery.data, blockedUserIds],
  );

  const buyersQuery = useQuery({
    queryKey: queryKeys.buyers(buyerFilters, sessionUser?.id ?? null),
    queryFn: () => fetchBuyers({ currentUserId: sessionUser!.id, filters: buyerFilters }),
    enabled: !!sessionUser && isBuyersTab && canUseBuyersTab,
  });
  const buyers = useMemo(
    () => (buyersQuery.data ?? []).filter((buyer) => !blockedUserIds.has(buyer.id)),
    [buyersQuery.data, blockedUserIds],
  );

  // --- Saved searches -----------------------------------------------------

  const savedSearchKind = isBuyersTab ? "buyers" : "listings";
  // What the bookmark would save right now: the draft of the feed on screen,
  // with the typed term folded in.
  const savedSearchFilters = useMemo(
    () =>
      isBuyersTab
        ? normalizeBuyerFilters({ ...draftBuyer, searchText: draftSearch.trim() || undefined })
        : normalizeListingFilters({ ...draftListing, searchText: draftSearch.trim() || undefined }),
    [isBuyersTab, draftBuyer, draftListing, draftSearch],
  );
  // Normalising drops every empty value, so an untouched draft is {} — a
  // search that matches everything is not worth saving.
  const canSaveSearch = Object.keys(savedSearchFilters).length > 0;
  const draftSignature = isBuyersTab
    ? getBuyerFiltersSignature(savedSearchFilters as BuyerFilters)
    : getListingFiltersSignature(savedSearchFilters as ListingFilters);

  const savedSearchesQuery = useQuery({
    queryKey: sessionUser ? queryKeys.savedSearches(sessionUser.id) : ["savedSearches", "guest"],
    queryFn: () => fetchSavedSearches(sessionUser!.id),
    enabled: !!sessionUser,
  });
  // Only compared within a kind: the same criteria on both feeds are two
  // different searches.
  const savedSignatures = useMemo(
    () =>
      new Set(
        (savedSearchesQuery.data ?? [])
          .filter((savedSearch) => savedSearch.kind === savedSearchKind)
          .map(savedSearchSignature),
      ),
    [savedSearchesQuery.data, savedSearchKind],
  );
  const isDraftSaved = savedSignatures.has(draftSignature) || recentlySavedSignature === draftSignature;

  const saveSearchMutation = useMutation({
    mutationFn: () => createSavedSearch(sessionUser!.id, savedSearchKind, savedSearchFilters),
    onSuccess: async (savedSearch) => {
      if (!sessionUser) return;
      const signature = savedSearchSignature(savedSearch);
      setRecentlySavedSignature(signature);
      queryClient.setQueryData<SavedSearch[]>(queryKeys.savedSearches(sessionUser.id), (current = []) =>
        current.some((item) => item.kind === savedSearch.kind && savedSearchSignature(item) === signature)
          ? current
          : [savedSearch, ...current],
      );
      await queryClient.invalidateQueries({ queryKey: queryKeys.savedSearches(sessionUser.id) });
      showToast({ type: "success", message: t("feed.saveSearchSuccess") });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("duplicate key")) return;
      showToast({ type: "error", message: t("feed.saveSearchFailed") });
    },
  });

  const handleSaveSearch = () => {
    if (!canSaveSearch) return;
    if (!sessionUser) {
      promptSignIn("savedSearch");
      return;
    }
    if (isDraftSaved || saveSearchMutation.isPending) return;
    saveSearchMutation.mutate();
  };

  // --- Applying, clearing, switching --------------------------------------

  const applyFilters = () => {
    const searchText = draftSearch.trim() || undefined;
    if (isBuyersTab) {
      setBuyerFilters(normalizeBuyerFilters({ ...draftBuyer, searchText }));
    } else {
      setListingFilters(normalizeListingFilters({ ...draftListing, searchText }));
    }
    setFiltersOpen(false);
  };

  const clearAll = () => {
    setDraftSearch("");
    if (isBuyersTab) {
      setDraftBuyer({});
      setBuyerFilters({});
    } else {
      setDraftListing({});
      setListingFilters({});
    }
    setRecentlySavedSignature(null);
    setFiltersOpen(false);
    setScrollToTopSignal((value) => value + 1);
  };

  const changeTab = (next: FeedTab) => {
    if (next === tab) return;
    // As in the app: the search term belongs to the feed it was typed on,
    // and leaving the Buyers feed drops its filters.
    setFiltersOpen(false);
    setListingFilters(omitSearch(listingFilters));
    setBuyerFilters({});
    setDraftSearch("");
    setRecentlySavedSignature(null);
    setTab(next);
  };

  const hasActiveFeedState = isBuyersTab
    ? Object.keys(buyerFilters).length > 0
    : Object.keys(listingFilters).length > 0;

  // Clicking Home while already on the feed: clear filters if any, back to
  // the top, and refetch so new listings show up — the app's re-tap on Home.
  useEffect(() => {
    const handleHome = () => {
      if (hasActiveFeedState) {
        clearAll();
      } else {
        setScrollToTopSignal((value) => value + 1);
      }
      if (isBuyersTab) void buyersQuery.refetch();
      else void feedQuery.refetch();
    };
    window.addEventListener(FEED_HOME_EVENT, handleHome);
    return () => window.removeEventListener(FEED_HOME_EVENT, handleHome);
  });

  // --- Rendering ------------------------------------------------------------

  const chipLabels = useMemo(
    () =>
      isBuyersTab ? getBuyerFilterChipLabels(buyerFilters, t) : getListingFilterChipLabels(listingFilters, t),
    [isBuyersTab, buyerFilters, listingFilters, t],
  );
  // A new filter set is a new feed: remounting starts it at the first card.
  const listingFeedKey = getListingFiltersSignature(listingFilters);

  const filtersPanel = (variant: "sidebar" | "sheet") =>
    isBuyersTab ? (
      <FeedFilters
        variant={variant}
        kind="buyers"
        draft={draftBuyer}
        onDraftChange={setDraftBuyer}
        onApply={applyFilters}
        onClearAll={clearAll}
        onSave={handleSaveSearch}
        isSaved={isDraftSaved}
        canSave={canSaveSearch}
      />
    ) : (
      <FeedFilters
        variant={variant}
        kind="listings"
        draft={draftListing}
        onDraftChange={setDraftListing}
        onApply={applyFilters}
        onClearAll={clearAll}
        onSave={handleSaveSearch}
        isSaved={isDraftSaved}
        canSave={canSaveSearch}
      />
    );

  let content: React.ReactNode;
  if (isBuyersTab) {
    content = !isBuyersGateSettled ? (
      <Spinner className="py-24" />
    ) : (
      <BuyersFeed
        buyers={buyers}
        isLoading={buyersQuery.isLoading}
        error={buyersQuery.error}
        onOffer={setOfferBuyer}
        initialScrollTop={useFeedStore.getState().buyersScrollTop}
        onScrollTopChange={setBuyersScrollTop}
        scrollToTopSignal={scrollToTopSignal}
      />
    );
  } else if (feedQuery.isLoading) {
    content = <Spinner className="py-24" />;
  } else if (feedQuery.error && listings.length === 0) {
    content = <p className="px-6 py-24 text-center text-lg font-semibold text-text">{t("feed.fetchError")}</p>;
  } else if (listings.length === 0) {
    content = (
      <div className="flex flex-col items-center gap-5 px-6 py-16 text-center">
        <NoListingsIllustration width={240} height={240} aria-hidden />
        <p className="max-w-sm text-[17px] font-semibold leading-6 text-text-muted">{t("feed.emptyListings")}</p>
      </div>
    );
  } else if (isDesktop) {
    content = (
      <ListingFeedGrid
        key={listingFeedKey}
        listings={listings}
        initialScrollTop={useFeedStore.getState().gridScrollTop}
        onScrollTopChange={setGridScrollTop}
        hasNextPage={feedQuery.hasNextPage}
        isFetchingNextPage={feedQuery.isFetchingNextPage}
        fetchNextPage={feedQuery.fetchNextPage}
        scrollToTopSignal={scrollToTopSignal}
      />
    );
  } else {
    content = (
      <ListingReel
        key={listingFeedKey}
        listings={listings}
        initialIndex={Math.min(useFeedStore.getState().reelIndex, listings.length - 1)}
        onIndexChange={setReelIndex}
        hasNextPage={feedQuery.hasNextPage}
        isFetchingNextPage={feedQuery.isFetchingNextPage}
        fetchNextPage={feedQuery.fetchNextPage}
        scrollToTopSignal={scrollToTopSignal}
      />
    );
  }

  return (
    // Full height, under the phone's floating tab bar (the shell pads <main>
    // for it; the negative margin takes that back so the reel can run beneath).
    <div className="-mb-[92px] flex h-dvh md:mb-0">
      {/* Collapsing animates the width; the content keeps its own width so
          it slides rather than reflows, and is inert while folded away. */}
      <aside
        className={cn(
          "hidden shrink-0 overflow-hidden bg-surface xl:block",
          animatePanel && "transition-[width] duration-300 ease-out",
          isFilterPanelOpen ? "w-[320px] border-r border-border" : "w-0",
        )}
        inert={!isFilterPanelOpen}
        aria-hidden={!isFilterPanelOpen}
      >
        <div className="flex h-full w-[320px] flex-col px-5 pb-4 pt-5">{filtersPanel("sidebar")}</div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <FeedTopBar
          tab={tab}
          onTabChange={changeTab}
          showTabs={canUseBuyersTab}
          activeFilterCount={chipLabels.length}
          onToggleFilters={() => (isXl ? togglePanel(!isFilterPanelOpen) : setFiltersOpen(true))}
          filtersExpanded={isXl ? isFilterPanelOpen : undefined}
        />
        <div className="relative min-h-0 flex-1">{content}</div>
      </section>

      <Modal
        open={isFiltersOpen && !isXl}
        onOpenChange={setFiltersOpen}
        title={t("web.feed.filters")}
        hideTitle
        className="md:max-w-lg md:max-h-[90dvh] md:overflow-y-auto md:pb-0"
      >
        {filtersPanel("sheet")}
      </Modal>

      <OfferListingDialog
        buyer={offerBuyer}
        currentUserId={sessionUser?.id ?? null}
        onClose={() => setOfferBuyer(null)}
      />
    </div>
  );
}
