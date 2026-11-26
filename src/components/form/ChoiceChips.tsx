"use client";

import { cn } from "@/lib/cn";

/**
 * Pick one of a few short options laid out as pills, all visible at once —
 * web port of the app's ChoiceChips (the feed's sort, the price basis, the
 * statistics period). A choice is always made (no empty state).
 */
export function ChoiceChips<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
  /** The group's name for screen readers. */
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.value)}
            className={cn(
              "min-h-9 rounded-full border px-3 text-sm transition-colors",
              isSelected
                ? "border-primary bg-surface font-semibold text-primary"
                : "border-border bg-surface-muted text-text hover:bg-surface",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
