"use client";

/**
 * Profile form selects — one shadcn Select configuration for all fields.
 * `FlagSelectField` adds flags; `SelectField` is the plain variant (gender, id type).
 */

import { useTranslations } from "next-intl";

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
import type { FlagSelectOption } from "@/lib/profile/selectOptions.ts";
import { cn } from "@/lib/utils";

/** Consistent popup positioning for every profile select (avoids alignItemWithTrigger jumps). */
const SELECT_CONTENT_PROPS = {
  alignItemWithTrigger: false,
  side: "bottom" as const,
  align: "start" as const,
  className: "max-h-60",
};

type SelectFieldBaseProps = {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  invalid: boolean;
  error?: { message?: string };
};

type PlainSelectOption = {
  value: string;
  label: string;
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

export function SelectField({
  id,
  label,
  placeholder,
  value,
  onChange,
  invalid,
  error,
  options,
}: SelectFieldBaseProps & { options: PlainSelectOption[] }) {
  const t = useTranslations("profile");
  const resolvedPlaceholder = placeholder ?? t("selectPlaceholder");
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
            <SelectOptionRow label={selected.label} inTrigger />
          ) : (
            <SelectValue placeholder={resolvedPlaceholder} />
          )}
        </SelectTrigger>
        <SelectContent {...SELECT_CONTENT_PROPS}>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {invalid ? <FieldError errors={[error]} /> : null}
    </Field>
  );
}

/**
 * @deprecated FlagSelectField moved to @/components/shared/flag-select-field.tsx.
 * Re-exported for backward compatibility.
 */
export { FlagSelectField } from "@/components/shared/flag-select-field.tsx";
