import { describe, expect, it } from "vitest";

import {
  normalizeTheme,
  themeHtmlClass,
  themeSwatches,
  THEME_ONYX_CLASS,
} from "@/lib/theme/appTheme";
import { updatePersonalDetailsSchema } from "@/lib/validations/user";
import { preferencesFormSchema } from "@/lib/validations/preferencesForms";
import { emptyPreferencesFormValues } from "@/lib/validations/preferencesForms";
import {
  mapPreferencesFormValuesToPatch,
  mapUserToPreferencesFormValues,
} from "@/lib/utils/preferencesFormMapping";

describe("appTheme helpers", () => {
  it("normalizes unknown values to default", () => {
    expect(normalizeTheme(undefined)).toBe("default");
    expect(normalizeTheme("")).toBe("default");
    expect(normalizeTheme("forest")).toBe("default");
    expect(normalizeTheme("onyx")).toBe("onyx");
  });

  it("maps onyx to html class and default to empty", () => {
    expect(themeHtmlClass("onyx")).toBe(THEME_ONYX_CLASS);
    expect(themeHtmlClass("default")).toBe("");
  });

  it("exposes swatch metadata for both themes", () => {
    expect(themeSwatches.default.length).toBeGreaterThanOrEqual(5);
    expect(themeSwatches.onyx.length).toBeGreaterThanOrEqual(5);
    expect(themeSwatches.default[2]).toBe("#b8520a");
    expect(themeSwatches.onyx[2]).toBe("#57463a");
  });
});

describe("preferredTheme validation", () => {
  it("accepts default and onyx on update schema", () => {
    expect(updatePersonalDetailsSchema.parse({ preferredTheme: "default" })).toEqual({
      preferredTheme: "default",
    });
    expect(updatePersonalDetailsSchema.parse({ preferredTheme: "onyx" })).toEqual({
      preferredTheme: "onyx",
    });
  });

  it("rejects unknown themes", () => {
    expect(() =>
      updatePersonalDetailsSchema.parse({ preferredTheme: "orange" }),
    ).toThrow();
  });

  it("requires preferredTheme on preferences form schema", () => {
    const parsed = preferencesFormSchema.parse({
      ...emptyPreferencesFormValues,
      preferredTheme: "onyx",
    });
    expect(parsed.preferredTheme).toBe("onyx");
  });
});

describe("preferredTheme preferences mapping", () => {
  it("defaults missing preferredTheme to default", () => {
    const values = mapUserToPreferencesFormValues({
      email: "a@b.com",
      preferredLanguage: "en",
    });
    expect(values.preferredTheme).toBe("default");
  });

  it("includes preferredTheme in dirty patch", () => {
    const patch = mapPreferencesFormValuesToPatch(
      { ...emptyPreferencesFormValues, preferredTheme: "onyx" },
      { preferredTheme: true },
    );
    expect(patch.preferredTheme).toBe("onyx");
  });
});
