import { describe, expect, it } from "vitest";
import {
  isProfileComplete,
  refreshTokenPayloadVersionMatchesDb,
} from "@/lib/auth/session.ts";
import {
  isValidConfirmEmailTokenInput,
  CONFIRM_EMAIL_CONSUMPTION_ERROR_MESSAGE,
} from "@/lib/auth/confirmEmail.ts";

describe("session helpers", () => {
  it("isProfileComplete is false for placeholder address", () => {
    expect(isProfileComplete({ address: { country: "Unknown" } })).toBe(false);
    expect(isProfileComplete(null)).toBe(false);
  });

  it("isProfileComplete is true when country is set", () => {
    expect(isProfileComplete({ address: { country: "Portugal" } })).toBe(true);
  });

  it("refreshTokenPayloadVersionMatchesDb treats missing token version as 0", () => {
    expect(refreshTokenPayloadVersionMatchesDb(undefined, 0)).toBe(true);
    expect(refreshTokenPayloadVersionMatchesDb(undefined, 1)).toBe(false);
    expect(refreshTokenPayloadVersionMatchesDb(1, 1)).toBe(true);
  });
});

describe("confirmEmail validation", () => {
  it("isValidConfirmEmailTokenInput rejects empty and non-strings", () => {
    expect(isValidConfirmEmailTokenInput(undefined)).toBe(false);
    expect(isValidConfirmEmailTokenInput("")).toBe(false);
    expect(isValidConfirmEmailTokenInput("   ")).toBe(false);
  });

  it("isValidConfirmEmailTokenInput accepts non-whitespace content", () => {
    expect(isValidConfirmEmailTokenInput("abc")).toBe(true);
  });

  it("uses a single consumption error message", () => {
    expect(CONFIRM_EMAIL_CONSUMPTION_ERROR_MESSAGE).toContain("invalid or has expired");
  });
});
