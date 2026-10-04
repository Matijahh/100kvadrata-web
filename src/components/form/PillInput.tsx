"use client";

import { cn } from "@/lib/cn";
import type { ComponentProps } from "react";

/**
 * The app's bare pill input (no label) — used where fields sit side by side,
 * like min / max ranges. Give it an aria-label when there is no visible label.
 */
export function PillInput({
  className,
  onChangeText,
  ...props
}: Omit<ComponentProps<"input">, "onChange"> & { onChangeText?: (value: string) => void }) {
  return (
    <input
      onChange={(event) => onChangeText?.(event.target.value)}
      className={cn(
        "min-h-[54px] w-full rounded-[25px] border border-transparent bg-surface-muted px-[15px] py-[15px] text-base text-text",
        "placeholder:text-placeholder focus:border-primary-soft focus:outline-none disabled:opacity-70",
        className,
      )}
      {...props}
    />
  );
}
