import { describe, expect, it } from "vitest";

import {
  getCountryLabel,
  getCountryOptions,
  isValidCountryCode,
  localeToFlagCode,
} from "@/lib/data/countries.ts";

describe("countries", () => {
  it("validates known ISO codes", () => {
    expect(isValidCountryCode("PT")).toBe(true);
    expect(isValidCountryCode("US")).toBe(true);
    expect(isValidCountryCode("Portugal")).toBe(false);
  });

  it("returns localized labels", () => {
    expect(getCountryLabel("PT", "en")).toBe("Portugal");
    expect(getCountryLabel("PT", "es")).toMatch(/Portugal/i);
  });

  it("sorts country options by label", () => {
    const options = getCountryOptions("en");
    expect(options.length).toBeGreaterThan(100);
    const labels = options.map((option) => option.label);
    expect([...labels].sort((a, b) => a.localeCompare(b, "en"))).toEqual(labels);
  });

  it("maps locales to flag codes", () => {
    expect(localeToFlagCode("en")).toBe("US");
    expect(localeToFlagCode("es")).toBe("ES");
  });
});
