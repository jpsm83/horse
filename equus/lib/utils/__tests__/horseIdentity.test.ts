import { describe, expect, it } from "vitest";

import {
  hasAtLeastOneHorseIdentity,
  normalizeHorseIdentityFields,
  normalizeHorseIdentityValue,
} from "@/lib/utils/horseIdentity.ts";

describe("normalizeHorseIdentityValue", () => {
  it("lowercases and strips spaces and symbols", () => {
    expect(normalizeHorseIdentityValue(" ABC-123 /xy ")).toBe("abc123xy");
  });

  it("returns empty for blank input", () => {
    expect(normalizeHorseIdentityValue("")).toBe("");
    expect(normalizeHorseIdentityValue("   ")).toBe("");
    expect(normalizeHorseIdentityValue(null)).toBe("");
    expect(normalizeHorseIdentityValue(undefined)).toBe("");
  });
});

describe("hasAtLeastOneHorseIdentity", () => {
  it("requires at least one non-empty normalized id", () => {
    expect(hasAtLeastOneHorseIdentity({})).toBe(false);
    expect(hasAtLeastOneHorseIdentity({ registryId: "---" })).toBe(false);
    expect(hasAtLeastOneHorseIdentity({ microchipId: "MC-1" })).toBe(true);
  });
});

describe("normalizeHorseIdentityFields", () => {
  it("omits empty fields", () => {
    expect(
      normalizeHorseIdentityFields({
        registryId: " Reg 1 ",
        microchipId: "",
        passportNumber: "P-2!",
      }),
    ).toEqual({ registryId: "reg1", passportNumber: "p2" });
  });
});
