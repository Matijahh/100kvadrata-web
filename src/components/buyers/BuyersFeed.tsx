"use client";

import NoBuyersIllustration from "@assets/illustrations/no-buyers.svg";
import { BuyerCard } from "@/components/buyers/BuyerCard";
import { Spinner } from "@/components/genericComponents/EmptyState";
import type { BuyerProfile } from "@/types/types";
import { useEffect, useLayoutEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

/** The Buyers tab: everyone whose preference set matches, as a grid of cards. */
export function BuyersFeed({
  buyers,
  isLoading,
  error,
  onOffer,
  initialScrollTop,
  onScrollTopChange,
  scrollToTopSignal,
}: {
  buyers: BuyerProfile[];
  isLoading: boolean;
  error: unknown;
  onOffer: (buyer: BuyerProfile) => void;
  initialScrollTop: number;
  onScrollTopChange: (top: number) => void;
  scrollToTopSignal: number;
}) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div
      ref={containerRef}
      onScroll={(event) => onScrollTopChange(event.currentTarget.scrollTop)}
      className="h-full overflow-y-auto overscroll-y-contain px-4 pb-[calc(96px+env(safe-area-inset-bottom))] pt-5 md:px-6 md:pb-10"
    >
      {isLoading && buyers.length === 0 ? (
        <Spinner className="py-24" />
      ) : error ? (
        <p className="px-6 py-24 text-center font-semibold text-text">{t("buyers.fetchError")}</p>
      ) : buyers.length === 0 ? (
        <div className="flex flex-col items-center gap-5 px-6 py-16 text-center">
          <NoBuyersIllustration width={280} height={187} aria-hidden />
          <p className="max-w-sm text-[17px] font-semibold leading-6 text-text-muted">{t("buyers.emptyState")}</p>
        </div>
      ) : (
        // Keyed by preference set: a buyer with three matching sets is three cards.
        <ul className="mx-auto grid max-w-[1400px] gap-x-4 gap-y-6 sm:grid-cols-2 2xl:grid-cols-3">
          {buyers.map((buyer) => (
            <li key={buyer.preferenceSetId}>
              <BuyerCard buyer={buyer} onOffer={onOffer} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
