/**
 * Localized app URL helpers for transactional emails and deep links.
 */

import { AUTH_CONFIG } from "@/lib/auth/config.ts";
import { normalizeAppBaseUrl } from "@/lib/auth/emailLinks.ts";
import { normalizeLocale, type AppLocale } from "@/i18n/resolveLocale.ts";

function resolveBaseUrl(): string {
  return normalizeAppBaseUrl(AUTH_CONFIG.APP_URL) ?? AUTH_CONFIG.APP_URL;
}

export function buildLocalizedAppLink(
  locale: string | undefined,
  pathSegment: string,
  params: Record<string, string> = {},
): string {
  const normalized = normalizeLocale(locale);
  const base = resolveBaseUrl();
  const baseForResolve = base.endsWith("/") ? base : `${base}/`;
  const prefix = normalized === "en" ? "" : `${normalized}/`;
  const query = new URLSearchParams(params).toString();
  const path = query ? `${prefix}${pathSegment}?${query}` : `${prefix}${pathSegment}`;
  return new URL(path, baseForResolve).href;
}

export function localePathSegment(locale: AppLocale, segment: string): string {
  return locale === "en" ? segment : `${locale}/${segment}`;
}
