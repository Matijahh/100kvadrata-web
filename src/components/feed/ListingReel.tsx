"use client";

import ChevronDownIcon from "@assets/icons/chevron-down-icon.svg";
import ChevronUpIcon from "@assets/icons/chevron-up-icon.svg";
import { EndOfFeed } from "@/components/feed/EndOfFeed";
import { ReelCard } from "@/components/feed/ReelCard";
import { Spinner } from "@/components/genericComponents/EmptyState";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { Listing } from "@/types/types";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

// Cards this far from the one on screen keep their media mounted, so the next
// swipe is instant; further ones are empty boxes (memory, and bandwidth — a
// mounted card loads its photos).
const NEAR_DISTANCE = 1;
// Start loading the next page this many cards before the end.
const PREFETCH_DISTANCE = 3;

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

/**
 * The reel: one listing per screen, snapped with CSS scroll-snap (wheel,
 * trackpad, touch and the keyboard all page through it natively), with the
 * card on screen tracked by an IntersectionObserver. Only that card plays
 * video — see ListingMedia.
 */
export function ListingReel({
  listings,
  initialIndex,
  onIndexChange,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  scrollToTopSignal,
}: {
  listings: Listing[];
  initialIndex: number;
  onIndexChange: (index: number) => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  /** Bumped by the feed to send the reel back to the first card. */
  scrollToTopSignal: number;
}) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  // Tablets with a mouse or trackpad get step buttons; touch swipes.
  const isPointerDevice = useMediaQuery("(min-width: 768px) and (pointer: fine)");

  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = "smooth") => {
    const container = containerRef.current;
    if (!container) return;
    const item = container.querySelector<HTMLElement>(`[data-reel-index="${index}"]`);
    if (item) container.scrollTo({ top: item.offsetTop, behavior });
  }, []);

  // Back to where the viewer was before they opened a listing.
  useLayoutEffect(() => {
    if (initialIndex > 0) scrollToIndex(initialIndex, "instant");
    // Mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const firstSignal = useRef(scrollToTopSignal);
  useEffect(() => {
    if (scrollToTopSignal !== firstSignal.current) scrollToIndex(0);
  }, [scrollToTopSignal, scrollToIndex]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveIndex(Number((entry.target as HTMLElement).dataset.reelIndex));
          }
        });
      },
      { root: container, threshold: 0.6 },
    );

    container.querySelectorAll("[data-reel-index]").forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [listings.length]);

  useEffect(() => {
    onIndexChange(activeIndex);
    if (activeIndex >= listings.length - PREFETCH_DISTANCE && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [activeIndex, listings.length, hasNextPage, isFetchingNextPage, fetchNextPage, onIndexChange]);

  // Arrow keys page through the reel from anywhere on the page, not only
  // when the scroller has focus — except while typing or in a dialog.
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target) || document.querySelector("[role=dialog],[role=alertdialog]")) return;

      if (event.key === "ArrowDown" || event.key === "PageDown" || event.key === "j") {
        event.preventDefault();
        scrollToIndex(Math.min(activeIndex + 1, listings.length - 1));
      } else if (event.key === "ArrowUp" || event.key === "PageUp" || event.key === "k") {
        event.preventDefault();
        scrollToIndex(Math.max(activeIndex - 1, 0));
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeIndex, listings.length, scrollToIndex]);

  const isAtEnd = !hasNextPage && listings.length > 0;

  return (
    <div className="relative h-full">
      <div
        ref={containerRef}
        tabIndex={-1}
        className="h-full snap-y snap-mandatory overflow-y-auto overscroll-y-contain outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {listings.map((listing, index) => (
          <section
            key={listing.id}
            data-reel-index={index}
            aria-roledescription="slide"
            aria-label={`${index + 1}`}
            className="h-full snap-start snap-always"
          >
            <ReelCard
              listing={listing}
              isActive={index === activeIndex}
              isNear={Math.abs(index - activeIndex) <= NEAR_DISTANCE}
            />
          </section>
        ))}

        {hasNextPage ? (
          <div className="flex h-40 snap-end items-center justify-center">
            <Spinner />
          </div>
        ) : isAtEnd ? (
          <EndOfFeed onBackToTop={() => scrollToIndex(0)} className="h-56 snap-end justify-center py-0 pb-24 md:pb-0" />
        ) : null}
      </div>

      {/* Mouse users get buttons; the keys work everywhere. */}
      {isPointerDevice && listings.length > 1 ? (
        <div className="absolute right-4 top-1/2 flex -translate-y-1/2 flex-col gap-3">
          <ReelStepButton
            label={t("web.feed.previous")}
            disabled={activeIndex === 0}
            onClick={() => scrollToIndex(activeIndex - 1)}
          >
            <ChevronUpIcon width={22} height={22} aria-hidden />
          </ReelStepButton>
          <ReelStepButton
            label={t("web.feed.next")}
            disabled={activeIndex >= listings.length - 1}
            onClick={() => scrollToIndex(activeIndex + 1)}
          >
            <ChevronDownIcon width={22} height={22} aria-hidden />
          </ReelStepButton>
        </div>
      ) : null}
    </div>
  );
}

function ReelStepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-text shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-opacity hover:opacity-90 disabled:opacity-35"
    >
      {children}
    </button>
  );
}
