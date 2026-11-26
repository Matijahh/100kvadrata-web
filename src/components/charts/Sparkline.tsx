/**
 * The shape of a number over the period, inside a stat tile — web port of the
 * app's Sparkline: a 2px line with a faint wash under it and a dot on today.
 * No axis, no labels. Drawn in a 100×100 box stretched to the tile's width
 * (the line keeps its 2px), with the dot as a separate element so it stays
 * round.
 */
export function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;

  const max = Math.max(0, ...values);
  const points = values.map((value, index) => ({
    x: (index / (values.length - 1)) * 100,
    // All zeros is a flat line along the bottom, not one floating midway.
    y: 100 - (max > 0 ? (value / max) * 100 : 0),
  }));
  const last = points[points.length - 1];
  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
  const area = `${line} L100,100 L0,100 Z`;

  return (
    // The padding is room for the dot and the line's width at the edges.
    <div className="h-7 p-[5px]" aria-hidden>
      <div className="relative h-full w-full">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
          <path d={area} className="fill-primary" opacity={0.1} />
          <path
            d={line}
            fill="none"
            className="stroke-primary"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {/* A ring in the tile's colour keeps the dot clear of the line. */}
        <span
          className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-primary"
          style={{ left: `${last.x}%`, top: `${last.y}%` }}
        />
      </div>
    </div>
  );
}
