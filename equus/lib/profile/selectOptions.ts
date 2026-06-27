/**
 * Shared option lists for profile flag selects (language, nationality, country).
 */

import type { AppLocale } from "@/i18n/resolveLocale.ts";
import { getCountryOptions, localeToFlagCode } from "@/lib/data/countries.ts";
import { appLocaleEnums } from "@/utils/enums.ts";

export type FlagSelectOption = {
  value: string;
  label: string;
  flagCode: string;
};

export function getLanguageSelectOptions(
  labels: Record<AppLocale, string>,
): FlagSelectOption[] {
  return appLocaleEnums.map((locale) => ({
    value: locale,
    label: labels[locale],
    flagCode: localeToFlagCode(locale),
  }));
}

export function getCountrySelectOptions(locale: AppLocale): FlagSelectOption[] {
  return getCountryOptions(locale).map((option) => ({
    value: option.value,
    label: option.label,
    flagCode: option.value,
  }));
}
