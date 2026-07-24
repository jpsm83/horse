"use client";

/**
 * Reusable flag select field — shadcn Select with country flags.
 * Used by ProfileForm and HorseListPage filter.
 * Empty (`""`) options use `common.selectPlaceholder` as the SelectItem value sentinel.
 */

import { useTranslations } from "next-intl";

import { FlagIcon } from "@/components/shared/country-flag.tsx";
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
import type { FlagSelectOption } from "@/components/shared/country-options.ts";
import {
  fromSelectValue,
  selectItemValue,
  toSelectValue,
} from "@/lib/ui/selectEmptyValue.ts";
import { cn } from "@/lib/utils";

type FlagSelectFieldProps = {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  invalid: boolean;
  error?: { message?: string };
  options: FlagSelectOption[];
};

function SelectOptionRow({
  label,
  flagCode,
  inTrigger = false,
}: {
  label: string;
  flagCode?: string;
  inTrigger?: boolean;
}) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2", inTrigger && "flex-1")}>
      {flagCode ? (
        <FlagIcon code={flagCode} sizeClass="h-4 w-4" withBorder={!inTrigger} />
      ) : null}
      <span className={cn(inTrigger && "truncate")}>{label}</span>
    </span>
  );
}

export function FlagSelectField({
  id,
  label,
  placeholder,
  value,
  onChange,
  invalid,
  error,
  options,
}: FlagSelectFieldProps) {
  const tCommon = useTranslations("common");
  const emptySentinel = placeholder ?? tCommon("selectPlaceholder");
  const selected = options.find((option) => option.value === value);

  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select
        value={toSelectValue(value, options, emptySentinel)}
        onValueChange={(nextValue) => onChange(fromSelectValue(nextValue, emptySentinel))}
      >
        <SelectTrigger id={id} className="w-full" aria-invalid={invalid}>
          {selected ? (
            <SelectOptionRow
              flagCode={selected.flagCode}
              label={selected.label}
              inTrigger
            />
          ) : (
            <SelectValue placeholder={emptySentinel} />
          )}
        </SelectTrigger>
        <SelectContent className="max-h-60" side="bottom" align="start" alignItemWithTrigger={false}>
          {options.map((option) => {
            const itemValue = selectItemValue(option.value, emptySentinel);
            return (
              <SelectItem key={itemValue} value={itemValue}>
                <SelectOptionRow flagCode={option.flagCode} label={option.label} />
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      {invalid ? <FieldError errors={[error]} /> : null}
    </Field>
  );
}
