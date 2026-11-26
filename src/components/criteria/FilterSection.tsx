"use client";

import ChevronDownIcon from "@assets/icons/chevron-down-icon.svg";
import { cn } from "@/lib/cn";
import { useId, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

/**
 * A group of filter fields that opens and closes — web port of the app's
 * FilterSection. The less-used groups start closed so the filters open on
 * what most people filter by; a closed group still shows how many of its
 * filters are set, so nothing narrows the feed out of sight.
 */
export function FilterSection({
  title,
  activeCount = 0,
  defaultOpen = false,
  children,
}: {
  title: string;
  /** How many filters inside are set; shown on the header, open or not. */
  activeCount?: number;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const [isOpen, setOpen] = useState(defaultOpen);
  const bodyId = useId();

  return (
    <section className="border-b border-divider">
      <button
        type="button"
        onClick={() => setOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls={bodyId}
        className="flex min-h-[52px] w-full items-center gap-2 text-left"
      >
        <span className="flex-1 font-display text-base text-text">{title}</span>
        {activeCount > 0 ? (
          <span
            className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-text-on-primary"
            aria-label={t("feed.filterSections.activeCount", { count: activeCount })}
          >
            {activeCount}
          </span>
        ) : null}
        <ChevronDownIcon
          width={18}
          height={18}
          className={cn("text-text-muted transition-transform", isOpen && "rotate-180")}
          aria-hidden
        />
      </button>
      <div id={bodyId} hidden={!isOpen} className="pb-3">
        {children}
      </div>
    </section>
  );
}
