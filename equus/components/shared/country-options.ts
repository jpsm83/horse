/**
 * Shared country select options for filters, profile forms, and create flows.
 */

import type { AppLocale } from "@/i18n/resolveLocale.ts";
import { getCountryOptions } from "@/lib/data/countries.ts";

export type FlagSelectOption = {
  value: string;
  label: string;
  flagCode: string;
};

export function getCountrySelectOptions(locale: AppLocale): FlagSelectOption[] {
  return getCountryOptions(locale).map((option) => ({
    value: option.value,
    label: option.label,
    flagCode: option.value,
  }));
}
