import { normalizeLocale } from "@/i18n/resolveLocale.ts";

export function resolveEmailLocale(locale?: string): ReturnType<typeof normalizeLocale> {
  return normalizeLocale(locale);
}

export function fallbackDisplayName(name?: string): string {
  return name?.trim() || "there";
}
