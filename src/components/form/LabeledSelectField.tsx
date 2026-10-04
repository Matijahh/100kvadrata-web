"use client";

import {
  LabeledMultiSelectField,
  type LabeledMultiSelectFieldProps,
} from "@/components/form/LabeledMultiSelectField";

type LabeledSelectFieldProps<T extends string> = Omit<
  LabeledMultiSelectFieldProps<T>,
  "values" | "onChange" | "selectionMode"
> & {
  value: T | null;
  onChange: (value: T | null) => void;
};

/**
 * Pick one. Drawn with the multi-choice panel so every choice is made the same
 * way (as in the app); only the marks differ, round for one and square for many.
 */
export function LabeledSelectField<T extends string>({
  value,
  onChange,
  allowEmpty = false,
  ...rest
}: LabeledSelectFieldProps<T>) {
  return (
    <LabeledMultiSelectField<T>
      {...rest}
      selectionMode="single"
      allowEmpty={allowEmpty}
      values={value == null ? [] : [value]}
      onChange={(values) => onChange(values[0] ?? null)}
    />
  );
}
