"use client";

import { cn } from "@/lib/cn";
import { forwardRef, useId, useImperativeHandle, useRef, useState } from "react";

// Web counterpart of flatswipe/src/components/form/CodeInput.tsx. Same idea:
// the boxes are decoration and one transparent input on top holds the whole
// code, so paste and the browser's one-time-code autofill fill every box at
// once and focus moves implicitly as digits are typed or deleted.

export type CodeInputHandle = {
  focus: () => void;
};

type CodeInputProps = {
  label: string;
  value: string;
  length: number;
  onChangeText: (value: string) => void;
  /** Fires once the last digit lands — by typing, pasting or autofill. */
  onComplete: (value: string) => void;
  hasError?: boolean;
  editable?: boolean;
  autoFocus?: boolean;
};

export const CodeInput = forwardRef<CodeInputHandle, CodeInputProps>(function CodeInput(
  {
    label,
    value,
    length,
    onChangeText,
    onComplete,
    hasError = false,
    editable = true,
    autoFocus = false,
  },
  ref,
) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setFocused] = useState(false);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }));

  const handleChange = (raw: string) => {
    // Paste and autofill can carry separators or a longer code than expected —
    // keep the digits, drop the overflow.
    const digits = raw.replace(/[^0-9]/g, "").slice(0, length);

    if (digits === value) {
      return;
    }

    onChangeText(digits);

    if (digits.length === length) {
      onComplete(digits);
    }
  };

  // Once the code is full there is no "next" box, so the highlight stays on
  // the last one.
  const activeIndex = Math.min(value.length, length - 1);

  return (
    <div className="mb-[15px]">
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-light text-form-label">
        {label}
      </label>
      <div className="relative flex gap-2">
        {Array.from({ length }, (_, index) => {
          const digit = value[index] ?? "";
          const isActive = isFocused && editable && index === activeIndex;

          return (
            <div
              key={index}
              aria-hidden
              className={cn(
                "flex h-14 flex-1 items-center justify-center rounded-[14px] border-2 border-border bg-surface-muted",
                "text-[22px] font-semibold text-text",
                digit !== "" && "border-primary-soft",
                isActive && "border-primary",
                hasError && "border-destructive text-destructive",
                !editable && "opacity-60",
              )}
            >
              {digit}
            </div>
          );
        })}
        <input
          ref={inputRef}
          id={inputId}
          value={value}
          onChange={(event) => handleChange(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={length}
          disabled={!editable}
          autoFocus={autoFocus}
          aria-invalid={hasError || undefined}
          className="absolute inset-0 h-full w-full cursor-text bg-transparent text-transparent caret-transparent outline-none selection:bg-transparent focus-visible:outline-none"
        />
      </div>
    </div>
  );
});
