import { getSharePercent } from "@/utils/chartData";
import { formatAmount } from "@/utils/rangeLabels";

export type SegmentedBarPart = {
  key: string;
  label: string;
  value: number;
};

/**
 * One whole split into a few parts (sale vs rent) — web port of the app's
 * SegmentedBar: blocks as wide as their share, the share printed inside when
 * the block is wide enough, and a legend naming every part with its count.
 * Colours are the theme's chart series (--c-chart-N, written by ThemeTokens),
 * in the order the parts are given, so a part keeps its colour.
 */
export function SegmentedBar({ parts }: { parts: SegmentedBarPart[] }) {
  const total = parts.reduce((sum, part) => sum + part.value, 0);
  // Two series colours; a third part would reuse the first.
  const slot = (index: number) => index % 2;

  return (
    <div>
      {total > 0 ? (
        // The surface showing between blocks is what separates them.
        <div className="flex h-7 gap-0.5" aria-hidden>
          {parts.map((part, index) =>
            part.value > 0 ? (
              <div
                key={part.key}
                className="@container flex min-w-0 items-center rounded px-2"
                style={{
                  flex: `${part.value} 1 0`,
                  backgroundColor: `var(--c-chart-${slot(index)})`,
                  color: `var(--c-chart-ink-${slot(index)})`,
                }}
              >
                {/* Printed only where "100%" fits. */}
                <span className="hidden truncate text-xs font-semibold @min-[28px]:block">
                  {getSharePercent(part.value, total)}%
                </span>
              </div>
            ) : null,
          )}
        </div>
      ) : null}

      <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
        {parts.map((part, index) => (
          <li key={part.key} className="flex items-center gap-1.5 text-xs text-text-muted">
            <span
              aria-hidden
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: `var(--c-chart-${slot(index)})` }}
            />
            {part.label}{" "}
            <span className="font-semibold text-text tabular-nums">{formatAmount(part.value)}</span>
            {total > 0 ? <span className="sr-only">{` (${getSharePercent(part.value, total)}%)`}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
