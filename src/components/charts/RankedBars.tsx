import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { formatAmount } from "@/utils/rangeLabels";

export type RankedBarItem = {
  key: string;
  label: string;
  value: number;
  /** The "everyone else" row: drawn grey so it doesn't read as one more entry. */
  isOther?: boolean;
  /** Makes the row a link (a listing). */
  href?: string;
};

/**
 * A ranked list with a bar per row, longest first — web port of the app's
 * RankedBars: label on top, then a thin bar from a shared left edge with its
 * value at the tip. Lengths are relative to the biggest row.
 */
export function RankedBars({ items }: { items: RankedBarItem[] }) {
  const max = Math.max(0, ...items.map((item) => item.value));

  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item) => {
        const share = max > 0 ? item.value / max : 0;
        const content = (
          <>
            <span className={cn("block truncate text-sm text-text", item.href && "underline")}>
              {item.label}
            </span>
            <span className="mt-1 flex items-center gap-2" aria-hidden>
              <span className="flex-1">
                {item.value > 0 ? (
                  <span
                    // Rounded at the data end, square at the shared left edge.
                    className={cn("block h-2.5 rounded-r", item.isOther ? "bg-tab-inactive" : "bg-primary")}
                    style={{ width: `${Math.max(2, share * 100)}%` }}
                  />
                ) : null}
              </span>
              <span className="min-w-9 text-right text-xs font-semibold text-text tabular-nums">
                {formatAmount(item.value)}
              </span>
            </span>
            <span className="sr-only">{`: ${formatAmount(item.value)}`}</span>
          </>
        );

        return (
          <li key={item.key}>
            {item.href ? (
              <Link href={item.href} className="block rounded-lg transition-opacity hover:opacity-70">
                {content}
              </Link>
            ) : (
              content
            )}
          </li>
        );
      })}
    </ul>
  );
}
