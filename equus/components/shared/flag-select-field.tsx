"use client";

/**
 * Reusable flag select field — shadcn Select with country flags.
 * Used by ProfileForm and HorseListPage filter.
 */

import { FlagIcon } from "@/components/ui/country-flag.tsx";
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
  const selected = options.find((option) => option.value === value);

  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select
        value={value || null}
        onValueChange={(nextValue) => onChange(nextValue ?? "")}
      >
        <SelectTrigger id={id} className="w-full" aria-invalid={invalid}>
          {selected ? (
            <SelectOptionRow
              flagCode={selected.flagCode}
              label={selected.label}
              inTrigger
            />
          ) : (
            <SelectValue placeholder={placeholder} />
          )}
        </SelectTrigger>
        <SelectContent className="max-h-60" side="bottom" align="start" alignItemWithTrigger={false}>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <SelectOptionRow flagCode={option.flagCode} label={option.label} />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {invalid ? <FieldError errors={[error]} /> : null}
    </Field>
  );
}
