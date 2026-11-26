"use client";

import { cn } from "@/lib/cn";
import { useTranslation } from "react-i18next";

/**
 * "Korak 1 od 2" with a bar under it — web port of the app's StepProgress, so
 * it is clear from the first screen that there is a second one.
 */
export function StepProgress({ step, total, className }: { step: number; total: number; className?: string }) {
  const { t } = useTranslation();
  const label = t("newListing.stepOf", { step, total });

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={step}
      className={cn("flex w-full max-w-[220px] flex-col gap-1.5", className)}
    >
      <span className="text-sm font-semibold text-text-muted">{label}</span>
      <span className="block h-1.5 overflow-hidden rounded-full bg-surface">
        <span
          className="block h-full rounded-full bg-primary transition-[width] duration-300"
          style={{ width: `${(step / total) * 100}%` }}
        />
      </span>
    </div>
  );
}
