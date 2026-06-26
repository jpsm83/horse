/**
 * Client-side NEXT_LOCALE cookie sync (language switcher).
 */

import {
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_COOKIE_NAME,
  normalizeLocale,
  type AppLocale,
} from "@/i18n/resolveLocale.ts";

export function syncLocaleCookie(locale?: string | null): AppLocale {
  const normalized = normalizeLocale(locale);
  if (typeof document === "undefined") return normalized;

  document.cookie = `${LOCALE_COOKIE_NAME}=${normalized}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax`;
  return normalized;
}
