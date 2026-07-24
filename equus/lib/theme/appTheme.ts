/**
 * App color themes (default | onyx) — cookie + html class helpers.
 * Guests and missing prefs always resolve to `default`.
 */

import { appThemeEnums } from "@/utils/enums.ts";

export const THEME_COOKIE_NAME = "EQUUS_THEME";
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
export const THEME_ONYX_CLASS = "theme-onyx";

export type AppTheme = (typeof appThemeEnums)[number];

/**
 * Display swatches for theme picker UI — hexes mirrored from `globals.css`
 * (`:root` / `.theme-onyx`): background, card, primary, secondary, accent.
 */
export const themeSwatches: Record<AppTheme, readonly string[]> = {
  default: ["#212226", "#2a3b42", "#b8520a", "#445a4d", "#779e7f"],
  onyx: ["#1d1e23", "#33363f", "#57463a", "#2e2b26", "#656772"],
};

export function normalizeTheme(value?: string | null): AppTheme {
  if (value === "onyx") return "onyx";
  return "default";
}

/** Class to put on `<html>` — empty string for default. */
export function themeHtmlClass(theme: AppTheme): string {
  return theme === "onyx" ? THEME_ONYX_CLASS : "";
}

export function applyThemeToDocument(theme: AppTheme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "onyx") {
    root.classList.add(THEME_ONYX_CLASS);
  } else {
    root.classList.remove(THEME_ONYX_CLASS);
  }
}

/** Client-side EQUUS_THEME cookie sync (profile theme switcher). */
export function syncThemeCookie(theme?: string | null): AppTheme {
  const normalized = normalizeTheme(theme);
  if (typeof document === "undefined") return normalized;

  document.cookie = `${THEME_COOKIE_NAME}=${normalized}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax`;
  return normalized;
}
