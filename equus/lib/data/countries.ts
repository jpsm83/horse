/**
 * ISO country codes and localized labels for profile nationality / address fields.
 * Codes align with `country-flag-icons` standard alpha-2 entries.
 */

import type { AppLocale } from "@/i18n/resolveLocale.ts";

/** Sovereign-style alpha-2 codes supported by `country-flag-icons` (excludes subdivisions like GB-ENG). */
const RAW_COUNTRY_CODES = [
  "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AR", "AS", "AT", "AU", "AW", "AX", "AZ",
  "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR",
  "BS", "BT", "BV", "BW", "BY", "BZ", "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL",
  "CM", "CN", "CO", "CR", "CU", "CV", "CW", "CX", "CY", "CZ", "DE", "DJ", "DK", "DM", "DO",
  "DZ", "EC", "EE", "EG", "EH", "ER", "ES", "ET", "FI", "FJ", "FK", "FM", "FO", "FR", "GA",
  "GB", "GD", "GE", "GF", "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT",
  "GU", "GW", "GY", "HK", "HM", "HN", "HR", "HT", "HU", "ID", "IE", "IL", "IM", "IN", "IO",
  "IQ", "IR", "IS", "IT", "JE", "JM", "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN", "KP",
  "KR", "KW", "KY", "KZ", "LA", "LB", "LC", "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY",
  "MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK", "ML", "MM", "MN", "MO", "MP", "MQ", "MR",
  "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ", "NA", "NC", "NE", "NF", "NG", "NI", "NL",
  "NO", "NP", "NR", "NU", "NZ", "OM", "PA", "PE", "PF", "PG", "PH", "PK", "PL", "PM", "PN",
  "PR", "PS", "PT", "PW", "PY", "QA", "RE", "RO", "RS", "RU", "RW", "SA", "SB", "SC", "SD",
  "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS", "ST", "SV", "SX",
  "SY", "SZ", "TC", "TD", "TF", "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO", "TR", "TT",
  "TV", "TW", "TZ", "UA", "UG", "UM", "US", "UY", "UZ", "VA", "VC", "VE", "VG", "VI", "VN",
  "VU", "WF", "WS", "XK", "YE", "YT", "ZA", "ZM", "ZW",
] as const;

export type CountryCode = (typeof RAW_COUNTRY_CODES)[number];

const COUNTRY_CODE_SET = new Set<string>(RAW_COUNTRY_CODES);

export const COUNTRY_CODES: readonly CountryCode[] = RAW_COUNTRY_CODES;

const displayNamesCache = new Map<string, Intl.DisplayNames>();

function getDisplayNames(locale: AppLocale): Intl.DisplayNames {
  const key = locale;
  let names = displayNamesCache.get(key);
  if (!names) {
    names = new Intl.DisplayNames([locale], { type: "region" });
    displayNamesCache.set(key, names);
  }
  return names;
}

/** Localized country/region label for an ISO alpha-2 code. */
export function getCountryLabel(code: string, locale: AppLocale): string {
  if (!isValidCountryCode(code)) {
    return code;
  }
  return getDisplayNames(locale).of(code) ?? code;
}

export function isKnownCountryCode(code: string): boolean {
  return /^[A-Z]{2}$/.test(code) && COUNTRY_CODE_SET.has(code);
}

export function isValidCountryCode(code: string): code is CountryCode {
  return isKnownCountryCode(code);
}

/** Country options sorted by localized label for selects. */
export function getCountryOptions(locale: AppLocale): { value: CountryCode; label: string }[] {
  return COUNTRY_CODES.map((code) => ({
    value: code,
    label: getCountryLabel(code, locale),
  })).sort((a, b) => a.label.localeCompare(b.label, locale));
}

/** Map app locale to a representative flag code (not always identical to language). */
export function localeToFlagCode(locale: AppLocale): CountryCode {
  if (locale === "es") return "ES";
  return "US";
}
