"use client";

import { getNiceAxisTop } from "@/utils/chartData";
import { formatAmount } from "@/utils/rangeLabels";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const PLOT_HEIGHT = 140;

type ColumnChartProps = {
  /** One value per bar, oldest first. */
  values: number[];
  /** What each bar covers, for the readout: "24. 11." or a week. */
  barLabels: string[];
  /** Read out with the total and with a selected bar's value. */
  unitLabel: string;
  /** Under the first and the last bar. */
  startLabel: string;
  endLabel: string;
};

/**
 * Columns from one baseline, one per day or week, in the brand colour — web
 * port of the app's ColumnChart. Hover (or tap, or tab to) a column to read
 * its value in the line above the chart; otherwise that line holds the
 * period's total. Three hairline gridlines (0, middle, top) carry the scale.
 */
export function ColumnChart({ values, barLabels, unitLabel, startLabel, endLabel }: ColumnChartProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<number | null>(null);

  const total = values.reduce((sum, value) => sum + value, 0);
  const max = Math.max(0, ...values);
  const top = getNiceAxisTop(max);
  const peakIndex = values.indexOf(max);
  const selectedIndex = selected !== null && selected < values.length ? selected : null;

  return (
    <div
      role="group"
      aria-label={t("adminStats.chartSummary", {
        total: formatAmount(total),
        unit: unitLabel,
        max: formatAmount(max),
        day: barLabels[peakIndex] ?? "",
      })}
    >
      <p className="mb-3 text-xs text-text-muted" aria-hidden>
        {selectedIndex !== null ? (
          <>
            <span className="text-base font-semibold text-text tabular-nums">
              {formatAmount(values[selectedIndex])}
            </span>
            {`  ${barLabels[selectedIndex] ?? ""}`}
          </>
        ) : (
          <>
            <span className="text-base font-semibold text-text tabular-nums">{formatAmount(total)}</span>
            {`  ${t("adminStats.inPeriod")}`}
          </>
        )}
      </p>

      <div className="flex">
        {/* Labels centred on their gridlines: top, middle, baseline. */}
        <div className="relative w-8 shrink-0" style={{ height: PLOT_HEIGHT }} aria-hidden>
          {[top, top / 2, 0].map((tick, index) => (
            <span
              key={tick}
              className="absolute right-1.5 -translate-y-1/2 text-xs leading-4 text-text-muted tabular-nums"
              style={{ top: `${index * 50}%` }}
            >
              {formatAmount(tick)}
            </span>
          ))}
        </div>

        <div className="relative flex-1" style={{ height: PLOT_HEIGHT }} onMouseLeave={() => setSelected(null)}>
          <span className="absolute inset-x-0 top-0 h-px bg-divider" aria-hidden />
          <span className="absolute inset-x-0 top-1/2 h-px bg-divider" aria-hidden />
          <span className="absolute inset-x-0 bottom-0 h-px bg-border" aria-hidden />

          {/* One target per column, its whole slot from top to baseline, so a
              short bar or an empty day is as easy to hit as the tallest. */}
          <div className="absolute inset-0 flex">
            {values.map((value, index) => (
              <button
                key={index}
                type="button"
                aria-label={`${formatAmount(value)} ${unitLabel}, ${barLabels[index] ?? ""}`}
                onMouseEnter={() => setSelected(index)}
                onFocus={() => setSelected(index)}
                onBlur={() => setSelected(null)}
                onClick={() => setSelected(index)}
                className="flex h-full min-w-0 flex-1 cursor-default items-end justify-center focus-visible:outline-offset-0"
              >
                {value > 0 ? (
                  <span
                    // Rounded at the data end, square on the baseline; never
                    // fills its slot, the rest is the air between columns.
                    className="block rounded-t bg-primary transition-opacity"
                    style={{
                      height: `max(2px, ${(value / top) * 100}%)`,
                      width: "clamp(2px, 72%, 24px)",
                      opacity: selectedIndex === null || selectedIndex === index ? 1 : 0.35,
                    }}
                  />
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="ml-8 mt-1 flex justify-between text-xs leading-4 text-text-muted tabular-nums" aria-hidden>
        <span>{startLabel}</span>
        <span>{endLabel}</span>
      </div>
    </div>
  );
}
