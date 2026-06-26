/**
 * Set next-intl locale cookie on auth API responses (register, login).
 */

import type { NextResponse } from "next/server";

import {
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_COOKIE_NAME,
  normalizeLocale,
  type AppLocale,
} from "@/i18n/resolveLocale.ts";

export function attachLocaleCookie(
  response: NextResponse,
  locale?: string | null,
): AppLocale {
  const normalized = normalizeLocale(locale);
  response.cookies.set(LOCALE_COOKIE_NAME, normalized, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
  });
  return normalized;
}
