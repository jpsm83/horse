/**
 * Profile-specific option lists.
 * Shared country options live in `@/components/shared/country-options`.
 */

import type { AppLocale } from "@/i18n/resolveLocale.ts";
import { localeToFlagCode } from "@/lib/data/countries.ts";
import { appLocaleEnums } from "@/utils/enums.ts";
import type { FlagSelectOption } from "@/components/shared/country-options.ts";

export { getCountrySelectOptions } from "@/components/shared/country-options.ts";
export type { FlagSelectOption } from "@/components/shared/country-options.ts";

export function getLanguageSelectOptions(
  labels: Record<AppLocale, string>,
): FlagSelectOption[] {
  return appLocaleEnums.map((locale) => ({
    value: locale,
    label: labels[locale],
    flagCode: localeToFlagCode(locale),
  }));
}
