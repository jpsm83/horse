import { DOMAIN, languageMap, supportedLocales } from "./config.ts";

export function generateCanonicalUrl(locale: string, path: string): string {
  const base = DOMAIN.endsWith("/") ? DOMAIN.slice(0, -1) : DOMAIN;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const prefix = locale === "en" ? "" : `/${locale}`;
  return `${base}${prefix}${normalizedPath}`;
}

export function generateLanguageAlternates(
  route: string
): Record<string, string> {
  const alternates: Record<string, string> = {};
  const normalizedRoute = route.startsWith("/") ? route : `/${route}`;

  for (const locale of supportedLocales) {
    const langCode = languageMap[locale];
    const path = locale === "en" ? normalizedRoute : `/${locale}${normalizedRoute}`;
    alternates[langCode] = `${DOMAIN}${path}`;
  }

  return alternates;
}
