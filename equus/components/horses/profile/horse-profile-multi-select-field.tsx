"use client";

/**
 * Multi-select for horse profile — same Field + trigger/content styling as
 * `HorseProfileSelectField` (shadcn Select), with multi-value selection.
 */

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";

import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type HorseProfileMultiSelectFieldProps = {
  id: string;
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  invalid: boolean;
  error?: { message?: string };
  options: { value: string; label: string }[];
  placeholder?: string;
};

/** Mirrors `SelectTrigger` in `components/ui/select.tsx` (default size + w-full). */
const TRIGGER_CLASS =
  "flex h-8 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";

/** Mirrors `SelectContent` popup chrome. */
const CONTENT_CLASS =
  "z-50 max-h-60 w-(--anchor-width) min-w-(--anchor-width) gap-0 overflow-x-hidden overflow-y-auto rounded-lg bg-popover p-0 text-popover-foreground shadow-md ring-1 ring-foreground/10";

/** Mirrors `SelectItem` row layout. */
const ITEM_CLASS =
  "relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground";

export function HorseProfileMultiSelectField({
  id,
  label,
  value,
  onChange,
  invalid,
  error,
  options,
  placeholder,
}: HorseProfileMultiSelectFieldProps) {
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);

  const emptySentinel = placeholder ?? tCommon("selectPlaceholder");

  const labelMap = useMemo(
    () => Object.fromEntries(options.map((o) => [o.value, o.label])),
    [options],
  );

  const displayValue =
    value.length > 0
      ? value.map((v) => labelMap[v] ?? v).join(", ")
      : null;

  function toggle(optionValue: string) {
    const next = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(next);
  }

  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid}
          className={cn(TRIGGER_CLASS, !displayValue && "text-muted-foreground")}
        >
          <span className="flex flex-1 truncate text-left">{displayValue ?? emptySentinel}</span>
          <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          side="bottom"
          className={CONTENT_CLASS}
        >
          <div className="scroll-my-1 p-1" role="listbox" aria-multiselectable>
            {options.map((option) => {
              const isSelected = value.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={ITEM_CLASS}
                  onClick={() => toggle(option.value)}
                >
                  <span className="flex flex-1 shrink-0 gap-2 whitespace-nowrap">
                    {option.label}
                  </span>
                  {isSelected ? (
                    <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
                      <CheckIcon className="pointer-events-none size-4" />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
      {invalid ? <FieldError errors={[error]} /> : null}
    </Field>
  );
}
