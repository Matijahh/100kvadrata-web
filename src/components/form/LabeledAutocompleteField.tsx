"use client";

import { cn } from "@/lib/cn";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

// Web counterpart of flatswipe/src/components/form/LabeledAutocompleteField.tsx:
// free text with debounced suggestions underneath (cities, municipalities,
// streets from services/locations). Same props, plus keyboard navigation.

const DEBOUNCE_MS = 300;

type LabeledAutocompleteFieldProps<T> = {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (value: string) => void;
  /** Fired when the user picks a suggestion (after onChangeText with its label). */
  onSelect?: (item: T) => void;
  fetchSuggestions: (query: string) => Promise<T[]>;
  queryKey: (query: string) => readonly unknown[];
  getItemLabel: (item: T) => string;
  getItemDescription?: (item: T) => string | null | undefined;
  /** Minimum typed characters before suggestions are fetched. */
  minChars?: number;
  /** Set false to keep the field plain-text only. */
  suggestionsEnabled?: boolean;
  editable?: boolean;
  onFocus?: () => void;
};

export function LabeledAutocompleteField<T>({
  label,
  placeholder,
  value,
  onChangeText,
  onSelect,
  fetchSuggestions,
  queryKey,
  getItemLabel,
  getItemDescription,
  minChars = 2,
  suggestionsEnabled = true,
  editable = true,
  onFocus,
}: LabeledAutocompleteFieldProps<T>) {
  const { t } = useTranslation();
  const inputId = useId();
  const listId = `${inputId}-list`;
  const [isFocused, setIsFocused] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  // Once a suggestion is picked, keep the list closed until the user types again.
  const [isDismissed, setIsDismissed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(value.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [value]);

  const queryActive =
    suggestionsEnabled && isFocused && !isDismissed && debouncedQuery.length >= minChars;

  const { data: suggestions, isFetching } = useQuery({
    queryKey: queryKey(debouncedQuery),
    queryFn: () => fetchSuggestions(debouncedQuery),
    enabled: queryActive,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  const items = suggestions ?? [];
  const isDebouncing = value.trim() !== debouncedQuery;
  const showLoading = queryActive && (isFetching || isDebouncing);
  const showNoResults = queryActive && !isFetching && !isDebouncing && items.length === 0;
  const showSuggestions = queryActive && items.length > 0;

  useEffect(() => {
    setActiveIndex(-1);
  }, [suggestions]);

  const handleSelect = (item: T) => {
    setIsDismissed(true);
    onChangeText(getItemLabel(item));
    onSelect?.(item);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(items.length - 1, index + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(-1, index - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      handleSelect(items[activeIndex]);
    } else if (event.key === "Escape") {
      setIsDismissed(true);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative mb-[15px]"
      onBlur={(event) => {
        // Keep the list while focus moves into it (a click on a suggestion).
        if (!containerRef.current?.contains(event.relatedTarget as Node | null)) {
          setIsFocused(false);
        }
      }}
    >
      {label ? (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-light text-form-label">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <input
          id={inputId}
          value={value}
          placeholder={placeholder}
          aria-label={label ? undefined : placeholder}
          disabled={!editable}
          autoComplete="off"
          spellCheck={false}
          role="combobox"
          aria-expanded={showSuggestions}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          onChange={(event) => {
            setIsDismissed(false);
            onChangeText(event.target.value);
          }}
          onFocus={() => {
            setIsFocused(true);
            onFocus?.();
          }}
          onKeyDown={handleKeyDown}
          className="min-h-[54px] w-full rounded-[25px] border border-transparent bg-surface-muted px-[15px] py-[15px] pr-11 text-base text-text placeholder:text-placeholder focus:border-primary-soft focus:outline-none disabled:opacity-70"
        />
        {showLoading ? (
          <span
            aria-hidden
            className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-placeholder border-t-transparent"
          />
        ) : null}
      </div>

      {showSuggestions ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 z-30 mt-1.5 max-h-72 overflow-y-auto rounded-[20px] bg-surface-elevated py-1 shadow-[0_12px_32px_rgba(0,0,0,0.16)]"
        >
          {items.map((item, index) => {
            const itemLabel = getItemLabel(item);
            const description = getItemDescription?.(item);
            return (
              <li key={`${itemLabel}-${index}`} role="presentation">
                <button
                  type="button"
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  // mousedown would blur the input first and close the list.
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelect(item)}
                  className={cn(
                    "block w-full px-4 py-3 text-left",
                    index > 0 && "border-t border-divider",
                    index === activeIndex ? "bg-surface-muted" : "hover:bg-surface-muted",
                  )}
                >
                  <span className="block truncate text-[15px] text-text">{itemLabel}</span>
                  {description ? (
                    <span className="block truncate text-xs text-text-muted">{description}</span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {showNoResults ? (
        <p className="mt-1.5 px-[15px] text-xs text-text-muted">{t("common.autocompleteNoResults")}</p>
      ) : null}
    </div>
  );
}
