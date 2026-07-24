"use client";

/**
 * Horse profile / sale select — same empty-value sentinel as SelectField / FlagSelectField
 * (`common.selectPlaceholder`, or an explicit placeholder override).
 */

import { useTranslations } from "next-intl";

import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fromSelectValue,
  selectItemValue,
  toSelectValue,
} from "@/lib/ui/selectEmptyValue.ts";

const SELECT_CONTENT_PROPS = {
  alignItemWithTrigger: false,
  side: "bottom" as const,
  align: "start" as const,
  className: "max-h-60",
} as const;

type HorseSelectFieldProps = {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  invalid: boolean;
  error?: { message?: string };
  options: { value: string; label: string }[];
};

export function HorseSelectField({
  id,
  label,
  placeholder,
  value,
  onChange,
  invalid,
  error,
  options,
}: HorseSelectFieldProps) {
  const tCommon = useTranslations("common");
  const emptySentinel = placeholder ?? tCommon("selectPlaceholder");

  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select
        value={toSelectValue(value, options, emptySentinel)}
        onValueChange={(next) => onChange(fromSelectValue(next, emptySentinel))}
      >
        <SelectTrigger id={id} className="w-full" aria-invalid={invalid}>
          <SelectValue placeholder={emptySentinel} />
        </SelectTrigger>
        <SelectContent {...SELECT_CONTENT_PROPS}>
          {options.map((option) => {
            const itemValue = selectItemValue(option.value, emptySentinel);
            return (
              <SelectItem key={itemValue} value={itemValue}>
                {option.label}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      {invalid ? <FieldError errors={[error]} /> : null}
    </Field>
  );
}
