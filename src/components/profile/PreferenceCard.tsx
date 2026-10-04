"use client";

import TrashIcon from "@assets/icons/trash-icon.svg";
import { cn } from "@/lib/cn";
import type { PreferenceSet } from "@/types/types";
import { getPreferenceSummary } from "@/utils/preferenceSets";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const VISIBLE_CHIPS = 6;

/**
 * One "what you're looking for" set — on a buyer's own profile (editable) or
 * on somebody else's (read-only, expandable). Web counterpart of the app's
 * PreferenceCard; title and chips come from the shared getPreferenceSummary.
 */
export function PreferenceCard({
  preferenceSet,
  index,
  onOpen,
  onDelete,
}: {
  preferenceSet: PreferenceSet;
  index: number;
  /** Own profile: open the editor. Omitted on someone else's profile. */
  onOpen?: () => void;
  onDelete?: () => void;
}) {
  const { t } = useTranslation();
  const [isExpanded, setExpanded] = useState(false);
  const { title, chips } = useMemo(
    () => getPreferenceSummary(preferenceSet, index, t),
    [preferenceSet, index, t],
  );
  const description = preferenceSet.description?.trim() || null;
  const visibleChips = isExpanded ? chips : chips.slice(0, VISIBLE_CHIPS);
  const hiddenCount = chips.length - visibleChips.length;
  const canExpand = !onOpen && chips.length > VISIBLE_CHIPS;

  const body = (
    <>
      <div className="flex items-start gap-3">
        <h3 className="flex-1 font-display text-lg leading-tight text-text">{title}</h3>
      </div>
      {description ? (
        <p className={cn("mt-2 text-sm leading-5 text-text-muted", !isExpanded && "line-clamp-2")}>
          {description}
        </p>
      ) : null}
      {chips.length === 0 ? (
        onOpen && !description ? (
          <p className="mt-3 text-sm text-text-muted">{t("preferences.emptyHint")}</p>
        ) : null
      ) : (
        <ul className="mt-3 flex flex-wrap items-center gap-1.5">
          {visibleChips.map((chip) => (
            <li key={chip} className="rounded-full bg-surface-muted px-3 py-1 text-[13px] text-text">
              {chip}
            </li>
          ))}
          {hiddenCount > 0 || (canExpand && isExpanded) ? (
            <li className="px-1 text-[13px] font-semibold text-primary">
              {isExpanded ? t("preferences.showLess") : t("preferences.moreChips", { count: hiddenCount })}
            </li>
          ) : null}
        </ul>
      )}
    </>
  );

  const cardClass =
    "relative rounded-3xl border border-border bg-surface p-5 text-left transition-shadow";

  return (
    <div className="relative">
      {onOpen ? (
        <button type="button" onClick={onOpen} className={cn(cardClass, "w-full pr-12 hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)]")}>
          {body}
        </button>
      ) : canExpand ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={isExpanded}
          className={cn(cardClass, "w-full")}
        >
          {body}
        </button>
      ) : (
        <div className={cardClass}>{body}</div>
      )}
      {onDelete ? (
        <button
          type="button"
          onClick={onDelete}
          aria-label={t("preferences.delete")}
          className="absolute right-3 top-3 rounded-full p-2 text-placeholder hover:bg-surface-muted hover:text-destructive"
        >
          <TrashIcon width={18} height={18} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
