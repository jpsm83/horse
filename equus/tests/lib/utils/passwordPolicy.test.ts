import { describe, expect, it } from "vitest";
import {
  isValidPassword,
  PASSWORD_POLICY_MESSAGE,
} from "@/lib/utils/passwordPolicy.ts";

describe("passwordPolicy", () => {
  it("rejects passwords that do not meet policy", () => {
    expect(isValidPassword("short")).toBe(false);
    expect(isValidPassword("alllowercase1!")).toBe(false);
    expect(isValidPassword("ALLUPPERCASE1!")).toBe(false);
    expect(isValidPassword("NoNumber!")).toBe(false);
    expect(isValidPassword("NoSymbol1a")).toBe(false);
  });

  it("accepts passwords that meet policy", () => {
    expect(isValidPassword("TestPass1!")).toBe(true);
  });

  it("exposes a human-readable policy message", () => {
    expect(PASSWORD_POLICY_MESSAGE).toContain("8 characters");
  });
});
