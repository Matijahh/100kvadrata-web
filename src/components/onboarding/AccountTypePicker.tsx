"use client";

import HouseIcon from "@assets/icons/house-icon.svg";
import SearchIcon from "@assets/icons/search-icon.svg";
import { cn } from "@/lib/cn";
import { ACCOUNT_TYPE_VALUES, AccountType } from "@/types/types";
import type { FC, SVGProps } from "react";
import { useTranslation } from "react-i18next";

const ACCOUNT_TYPE_ICONS: Record<AccountType, FC<SVGProps<SVGSVGElement>>> = {
  buyer: SearchIcon,
  seller: HouseIcon,
};

type AccountTypePickerProps = {
  value: AccountType | null;
  onChange: (accountType: AccountType) => void;
  /** Titles only, side by side — for Edit profile. Onboarding explains each. */
  compact?: boolean;
};

/**
 * The one question onboarding really needs answered — web counterpart of the
 * app's AccountTypePicker, shared with Edit profile like there.
 */
export function AccountTypePicker({ value, onChange, compact = false }: AccountTypePickerProps) {
  const { t } = useTranslation();

  return (
    <div
      role="radiogroup"
      className={cn("flex flex-col gap-3", compact && "flex-row", !compact && "md:flex-row")}
    >
      {ACCOUNT_TYPE_VALUES.map((accountType) => {
        const Icon = ACCOUNT_TYPE_ICONS[accountType];
        const isSelected = value === accountType;

        return (
          <button
            key={accountType}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(accountType)}
            className={cn(
              "flex flex-1 items-center gap-3.5 rounded-[22px] border-2 border-transparent bg-surface-muted p-4 text-left transition",
              "hover:border-primary-soft/60",
              compact && "min-h-14 gap-2.5 rounded-2xl p-3",
              !compact && "md:flex-col md:items-start md:p-6",
              isSelected && "border-primary bg-surface hover:border-primary",
            )}
          >
            <span
              className={cn(
                "flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full border border-border bg-surface text-primary",
                compact && "h-[34px] w-[34px]",
                isSelected && "border-primary bg-primary text-text-on-primary",
              )}
            >
              <Icon width={compact ? 18 : 22} height={compact ? 18 : 22} aria-hidden />
            </span>
            <span className="flex flex-1 flex-col gap-[3px]">
              <span
                className={cn(
                  "font-display text-base text-text",
                  compact && "text-sm",
                  isSelected && "text-primary",
                )}
              >
                {t(`onboarding.accountType.${accountType}.title`)}
              </span>
              {compact ? null : (
                <span className="text-[13px] leading-[18px] text-text-muted">
                  {t(`onboarding.accountType.${accountType}.description`)}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
