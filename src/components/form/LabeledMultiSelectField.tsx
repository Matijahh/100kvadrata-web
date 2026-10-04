"use client";

import CheckboxCheckIcon from "@assets/icons/checkbox-check-icon.svg";
import ChevronDownIcon from "@assets/icons/chevron-down-icon.svg";
import CloseIcon from "@assets/icons/close-icon.svg";
import RadioOffIcon from "@assets/icons/radio-off-icon.svg";
import RadioOnIcon from "@assets/icons/radio-on-icon.svg";
import UncheckedIcon from "@assets/icons/unchecked-icon.svg";
import { Modal } from "@/components/ui/Modal";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/cn";
import { Popover } from "radix-ui";
import { ReactNode, useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

// Web counterpart of flatswipe/src/components/form/LabeledMultiSelectField.tsx
// with the same props and rules (single/multi mode, allowEmpty, per-option
// detail inputs, selected-label overrides). The options open in a dropdown on
// desktop and in the app's bottom sheet on phones.

type MultiSelectOption<T extends string> = {
  label: string;
  value: T;
};

export type LabeledMultiSelectFieldProps<T extends string> = {
  label: string;
  placeholder: string;
  options: MultiSelectOption<T>[];
  values: T[];
  onChange: (values: T[]) => void;
  /**
   * Extra input belonging to one option (a floor number once "Other" is
   * picked). Renders under that option, only while it is selected — inside
   * the open panel, because that is where the user is when they pick it.
   */
  renderOptionDetail?: (value: T) => ReactNode;
  /** What a selected option reads as in the collapsed field; null keeps its label. */
  getSelectedLabel?: (value: T) => string | null;
  /** "single" = radio marks and picking moves the choice. See LabeledSelectField. */
  selectionMode?: "single" | "multi";
  /** Single choice only: whether picking the selected option clears it. */
  allowEmpty?: boolean;
  disabled?: boolean;
  className?: string;
};

export function LabeledMultiSelectField<T extends string>({
  label,
  placeholder,
  options,
  values,
  onChange,
  renderOptionDetail,
  getSelectedLabel,
  selectionMode = "multi",
  allowEmpty = false,
  disabled = false,
  className,
}: LabeledMultiSelectFieldProps<T>) {
  const isSingle = selectionMode === "single";
  const isDesktop = useIsDesktop();
  const labelId = useId();
  const [isOpen, setIsOpen] = useState(false);

  const selectedText = useMemo(() => {
    if (values.length === 0) {
      return placeholder;
    }

    return options
      .filter((option) => values.includes(option.value))
      .map((option) => getSelectedLabel?.(option.value) ?? option.label)
      .join(", ");
  }, [getSelectedLabel, options, placeholder, values]);

  const toggleValue = (nextValue: T) => {
    const isSelected = values.includes(nextValue);

    if (isSingle) {
      if (isSelected) {
        onChange(allowEmpty ? [] : values);
        return;
      }

      onChange([nextValue]);
      // One-of: the answer is given, so the dropdown gets out of the way —
      // unless the option asks for more (its detail input is inside the panel).
      if (!renderOptionDetail?.(nextValue)) {
        setIsOpen(false);
      }
      return;
    }

    onChange(
      isSelected ? values.filter((value) => value !== nextValue) : [...values, nextValue],
    );
  };

  const trigger = (
    <button
      type="button"
      disabled={disabled}
      aria-labelledby={labelId}
      aria-haspopup="listbox"
      aria-expanded={isOpen}
      // On desktop Popover.Trigger opens it; a click handler here as well would
      // fight its toggle.
      onClick={isDesktop ? undefined : () => setIsOpen(true)}
      className={cn(
        "flex min-h-[54px] w-full items-center justify-between gap-3 rounded-[25px] border border-transparent bg-surface-muted px-[15px] py-[15px] text-left",
        "focus-visible:border-primary-soft disabled:cursor-not-allowed disabled:opacity-70",
        isOpen && "border-primary-soft",
      )}
    >
      <span
        className={cn(
          "line-clamp-2 flex-1 text-base",
          values.length === 0 ? "text-placeholder" : "text-text",
        )}
      >
        {selectedText}
      </span>
      <ChevronDownIcon width={18} height={18} className="shrink-0 text-placeholder" aria-hidden />
    </button>
  );

  const list = (
    <OptionList
      label={label}
      options={options}
      values={values}
      isSingle={isSingle}
      isOpen={isOpen}
      onToggle={toggleValue}
      renderOptionDetail={renderOptionDetail}
    />
  );

  return (
    <div className={cn("mb-[15px]", className)}>
      <span id={labelId} className="mb-1.5 block text-sm font-light text-form-label">
        {label}
      </span>

      {isDesktop ? (
        <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
          <Popover.Trigger asChild>{trigger}</Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              align="start"
              sideOffset={6}
              collisionPadding={16}
              className="z-50 flex max-h-[min(420px,var(--radix-popover-content-available-height))] w-[var(--radix-popover-trigger-width)] min-w-[280px] flex-col rounded-3xl bg-surface p-3 shadow-[0_12px_40px_rgba(0,0,0,0.18)] outline-none data-[state=open]:animate-[fade-in_120ms_ease-out]"
            >
              {list}
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      ) : (
        <>
          {trigger}
          <Modal open={isOpen} onOpenChange={setIsOpen} title={label} hideTitle>
            <div className="mb-3 flex items-center justify-between">
              <span className="font-display text-lg text-text">{label}</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label={label}
                className="rounded-full p-1 text-text"
              >
                <CloseIcon width={22} height={22} aria-hidden />
              </button>
            </div>
            {list}
            <DoneButton onClick={() => setIsOpen(false)} />
          </Modal>
        </>
      )}
    </div>
  );
}

function DoneButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-4 w-full rounded-[25px] bg-primary p-[15px] font-display text-base uppercase text-text-on-primary"
    >
      {t("common.done")}
    </button>
  );
}

function OptionList<T extends string>({
  label,
  options,
  values,
  isSingle,
  isOpen,
  onToggle,
  renderOptionDetail,
}: {
  label: string;
  options: MultiSelectOption<T>[];
  values: T[];
  isSingle: boolean;
  isOpen: boolean;
  onToggle: (value: T) => void;
  renderOptionDetail?: (value: T) => ReactNode;
}) {
  const selectedRef = useRef<HTMLDivElement>(null);

  // A long list opens on what is already chosen rather than at the top.
  useEffect(() => {
    if (isOpen) {
      selectedRef.current?.scrollIntoView({ block: "nearest" });
    }
  }, [isOpen]);

  return (
    <div
      role="listbox"
      aria-label={label}
      aria-multiselectable={!isSingle || undefined}
      className="-mx-1 flex min-h-0 flex-col gap-2.5 overflow-y-auto px-1"
    >
      {options.map((option, index) => {
        const isSelected = values.includes(option.value);
        const detail = isSelected ? renderOptionDetail?.(option.value) : null;
        // Round marks for one-of, square for any-of: the shape says how many
        // may be picked before you try.
        const Mark = isSingle
          ? isSelected
            ? RadioOnIcon
            : RadioOffIcon
          : isSelected
            ? CheckboxCheckIcon
            : UncheckedIcon;
        const isFirstSelected = isSelected && values[0] === option.value;

        return (
          <div
            key={option.value}
            ref={isFirstSelected ? selectedRef : undefined}
            className={cn(
              "shrink-0 overflow-hidden rounded-[20px] border border-transparent bg-surface-muted",
              isSelected && "border-primary",
            )}
          >
            <button
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => onToggle(option.value)}
              className="flex min-h-[54px] w-full items-center justify-between gap-4 px-4 py-3.5 text-left text-base text-text hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
            >
              <span>{option.label}</span>
              <Mark
                width={22}
                height={22}
                aria-hidden
                className={cn("shrink-0", isSelected ? "text-primary" : "text-placeholder")}
              />
            </button>
            {detail ? <div className="px-4 pb-3.5">{detail}</div> : null}
          </div>
        );
      })}
    </div>
  );
}
