"use client";

import ArrowUpToLineIcon from "@assets/icons/arrow-up-to-line-icon.svg";
import { cn } from "@/lib/cn";
import { useTranslation } from "react-i18next";

/**
 * Closes every feed — listings (grid and reel) and buyers — like the app's
 * BackToTopFooter: you have seen everything that matches, and the one thing
 * left is to go back up. Filters stay as they are; clearing is Home's job.
 */
export function EndOfFeed({ onBackToTop, className }: { onBackToTop: () => void; className?: string }) {
  const { t } = useTranslation();

  return (
    <div className={cn("flex flex-col items-center gap-3 py-10", className)}>
      <p className="text-sm text-text-muted">{t("web.feed.endOfFeed")}</p>
      <button
        type="button"
        onClick={onBackToTop}
        className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm font-semibold text-primary shadow-sm hover:opacity-90"
      >
        <ArrowUpToLineIcon width={16} height={16} aria-hidden />
        {t("feed.backToTop")}
      </button>
    </div>
  );
}
