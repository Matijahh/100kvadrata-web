"use client";

import { Sparkline } from "@/components/charts/Sparkline";
import { cn } from "@/lib/cn";
import { getPercentChange } from "@/utils/chartData";
import { useTranslation } from "react-i18next";

type StatTileProps = {
  label: string;
  /** Already formatted: "1.284", "68%". */
  value: string;
  /** A line under the value: "6 od 9". */
  hint?: string;
  /**
   * The same total for the period before, for the ▲/▼. `upIsGood` says which
   * way is good news; null for a number that is neither.
   */
  change?: { current: number; previous: number; upIsGood: boolean | null };
  /** One value per day of the period, for the line along the bottom. */
  trend?: number[];
};

/**
 * One number with its label, and optionally how it moved against the period
 * before and a sparkline of the period — web port of the app's StatTile. The
 * direction is always spelled out with ▲/▼ and a percentage, never by colour
 * alone.
 */
export function StatTile({ label, value, hint, change, trend }: StatTileProps) {
  const { t } = useTranslation();

  let changeText: string | null = null;
  let changeTone: "muted" | "good" | "bad" = "muted";

  if (change) {
    const percent = getPercentChange(change.current, change.previous);

    if (percent === null) changeText = `▲ ${t("adminStats.deltaNew")}`;
    else if (percent === 0) changeText = t("adminStats.deltaSame");
    else changeText = `${percent > 0 ? "▲" : "▼"} ${Math.abs(percent)}%`;

    const isUp = percent === null || percent > 0;
    const isDown = percent !== null && percent < 0;

    if (change.upIsGood !== null && (isUp || isDown)) {
      changeTone = isUp === change.upIsGood ? "good" : "bad";
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-0.5 rounded-3xl bg-surface px-4 py-3">
      <span className="line-clamp-2 text-xs text-text-muted">{label}</span>
      <span className="flex flex-wrap items-baseline gap-x-2">
        <span className="truncate text-[22px] font-semibold text-text tabular-nums">{value}</span>
        {changeText ? (
          <>
            <span
              aria-hidden
              className={cn(
                "text-xs font-semibold",
                changeTone === "muted" && "text-text-muted",
                changeTone === "good" && "text-success",
                changeTone === "bad" && "text-destructive",
              )}
            >
              {changeText}
            </span>
            <span className="sr-only">
              {t("adminStats.deltaA11y", { change: changeText.replace(/[▲▼]\s?/, "") })}
            </span>
          </>
        ) : null}
      </span>
      {hint ? <span className="truncate text-xs text-text-muted">{hint}</span> : null}
      {trend && trend.length > 1 ? (
        <div className="mt-1.5">
          <Sparkline values={trend} />
        </div>
      ) : null}
    </div>
  );
}
