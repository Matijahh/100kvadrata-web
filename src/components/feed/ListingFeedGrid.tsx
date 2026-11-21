"use client";

import { EndOfFeed } from "@/components/feed/EndOfFeed";
import { MarketingGridCard } from "@/components/feed/MarketingPostCards";
import { Spinner } from "@/components/genericComponents/EmptyState";
import { ListingCard, ListingGrid } from "@/components/listing/ListingCard";
import type { FeedEntry } from "@/utils/marketingFeed";
import { useEffect, useLayoutEffect, useRef } from "react";

/**
 * The grid alternative to the reel — what a desktop user comparing listings
 * side by side wants. Loads more as the end comes into view.
 */
export function ListingFeedGrid({
  entries,
  initialScrollTop,
  onScrollTopChange,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  scrollToTopSignal,
}: {
  /** Listings, with any marketing posts already mixed in (FEAT-42). */
  entries: FeedEntry[];
  initialScrollTop: number;
  onScrollTopChange: (top: number) => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  scrollToTopSignal: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (containerRef.current && initialScrollTop > 0) containerRef.current.scrollTop = initialScrollTop;
    // Mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const firstSignal = useRef(scrollToTopSignal);
  useEffect(() => {
    if (scrollToTopSignal !== firstSignal.current) {
      containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [scrollToTopSignal]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { root: containerRef.current, rootMargin: "600px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, entries.length]);

  return (
    <div
      ref={containerRef}
      onScroll={(event) => onScrollTopChange(event.currentTarget.scrollTop)}
      className="h-full overflow-y-auto overscroll-y-contain px-4 pb-[calc(96px+env(safe-area-inset-bottom))] pt-4 md:px-6 md:pb-10"
    >
      <ListingGrid className="mx-auto max-w-page">
        {entries.map((entry) =>
          entry.kind === "post" ? (
            <MarketingGridCard key={entry.key} post={entry.post} />
          ) : (
            <ListingCard key={entry.key} listing={entry.listing} />
          ),
        )}
      </ListingGrid>

      <div ref={sentinelRef} aria-hidden />
      {isFetchingNextPage ? <Spinner /> : null}
      {!hasNextPage && entries.length > 0 ? (
        <EndOfFeed onBackToTop={() => containerRef.current?.scrollTo({ top: 0, behavior: "smooth" })} />
      ) : null}
    </div>
  );
}
