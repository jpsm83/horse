import { describe, expect, it } from "vitest";

import { normalizeLocale, isSupportedLocale, localeFromAcceptLanguage } from "@/i18n/resolveLocale.ts";

describe("normalizeLocale", () => {
  it("maps regional English to en", () => {
    expect(normalizeLocale("en-US")).toBe("en");
    expect(normalizeLocale("en-GB")).toBe("en");
  });

  it("maps Spanish variants to es", () => {
    expect(normalizeLocale("es")).toBe("es");
    expect(normalizeLocale("es-MX")).toBe("es");
  });

  it("falls back unknown languages to en", () => {
    expect(normalizeLocale("fr")).toBe("en");
    expect(normalizeLocale("pt")).toBe("en");
    expect(normalizeLocale(undefined)).toBe("en");
    expect(normalizeLocale(null)).toBe("en");
  });
});

describe("localeFromAcceptLanguage", () => {
  it("picks Spanish from browser header", () => {
    expect(localeFromAcceptLanguage("es-ES,es;q=0.9,en;q=0.8")).toBe("es");
  });

  it("falls back to en", () => {
    expect(localeFromAcceptLanguage("fr-FR,fr;q=0.9")).toBe("en");
  });
});

describe("isSupportedLocale", () => {
  it("accepts en and es only", () => {
    expect(isSupportedLocale("en")).toBe(true);
    expect(isSupportedLocale("es")).toBe(true);
    expect(isSupportedLocale("fr")).toBe(false);
  });
});
