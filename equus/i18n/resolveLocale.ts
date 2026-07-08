/**
 * Shared locale types and normalization for web, email, and future mobile.
 */

import { appLocaleEnums } from "@/utils/enums.ts";

export type AppLocale = (typeof appLocaleEnums)[number];

export type EmailLocale = AppLocale;

export function normalizeLocale(input?: string | null): AppLocale {
  if (!input) return "en";
  const base = input.toLowerCase().trim().split("-")[0];
  if (base === "es") return "es";
  return "en";
}

export function isSupportedLocale(input: string): input is AppLocale {
  return appLocaleEnums.includes(input as AppLocale);
}

export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** First supported language from an HTTP Accept-Language header. */
export function localeFromAcceptLanguage(header: string | null | undefined): AppLocale {
  if (!header) return "en";

  for (const part of header.split(",")) {
    const tag = part.trim().split(";")[0];
    const locale = normalizeLocale(tag);
    if (tag.toLowerCase().startsWith("es") || locale === "es") return "es";
    if (tag.toLowerCase().startsWith("en") || locale === "en") return "en";
  }

  return "en";
}
