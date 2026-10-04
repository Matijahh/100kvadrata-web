"use client";

import ArrowUpToLineIcon from "@assets/icons/arrow-up-to-line-icon.svg";
import { Spinner } from "@/components/genericComponents/EmptyState";
import { ListingCard, ListingGrid } from "@/components/listing/ListingCard";
import type { Listing } from "@/types/types";
import { useEffect, useLayoutEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

/**
 * The grid alternative to the reel — what a desktop user comparing listings
 * side by side wants. Loads more as the end comes into view.
 */
export function ListingFeedGrid({
  listings,
  initialScrollTop,
  onScrollTopChange,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  scrollToTopSignal,
}: {
  listings: Listing[];
  initialScrollTop: number;
  onScrollTopChange: (top: number) => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  scrollToTopSignal: number;
}) {
  const { t } = useTranslation();
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
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, listings.length]);

  return (
    <div
      ref={containerRef}
      onScroll={(event) => onScrollTopChange(event.currentTarget.scrollTop)}
      className="h-full overflow-y-auto overscroll-y-contain px-4 pb-[calc(96px+env(safe-area-inset-bottom))] pt-4 md:px-6 md:pb-10"
    >
      <ListingGrid className="mx-auto max-w-[1400px]">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </ListingGrid>

      <div ref={sentinelRef} aria-hidden />
      {isFetchingNextPage ? <Spinner /> : null}
      {!hasNextPage && listings.length > 0 ? (
        <div className="flex flex-col items-center gap-3 py-10">
          <p className="text-sm text-text-muted">{t("web.feed.endOfFeed")}</p>
          <button
            type="button"
            onClick={() => containerRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm font-semibold text-primary shadow-sm hover:opacity-90"
          >
            <ArrowUpToLineIcon width={16} height={16} aria-hidden />
            {t("feed.backToTop")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
