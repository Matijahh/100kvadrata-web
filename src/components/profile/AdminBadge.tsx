"use client";

import CheckIcon from "@assets/icons/check-icon.svg";
import { cn } from "@/lib/cn";
import { useTranslation } from "react-i18next";

/**
 * Marks an admin account — web port of the app's AdminBadge. Admins can
 * message anyone directly, which no other account can, so whoever gets that
 * message needs to see it comes from the 100 Kvadrata team and not from a
 * stranger: on the profile, at the top of the chat and in the inbox.
 *
 * `compact` is the short "Admin" pill for a row that also holds a name and
 * more (chat header, inbox); the full "100 Kvadrata admin" is for the profile
 * card, which has the room.
 */
export function AdminBadge({ compact = false, className }: { compact?: boolean; className?: string }) {
  const { t } = useTranslation();

  return (
    <span
      className={cn(
        // Never squeezed by a long name beside it; the name gives way instead.
        "inline-flex shrink-0 items-center rounded-full bg-primary font-semibold text-text-on-primary",
        compact ? "min-h-5 gap-[3px] px-[7px] text-xs" : "min-h-[26px] gap-1 px-2.5 text-xs",
        className,
      )}
    >
      <CheckIcon width={compact ? 12 : 14} height={compact ? 12 : 14} aria-hidden />
      <span className="whitespace-nowrap">{compact ? t("admin.badgeShort") : t("admin.profileBadge")}</span>
    </span>
  );
}
