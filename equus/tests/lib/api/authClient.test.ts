import { describe, expect, it } from "vitest";

import { formatAuthProvider } from "@/lib/api/authClient.ts";

describe("formatAuthProvider", () => {
  it("formats known providers", () => {
    expect(formatAuthProvider("google")).toBe("Google");
    expect(formatAuthProvider("credentials")).toBe("Email & password");
  });

  it("falls back for unknown values", () => {
    expect(formatAuthProvider(undefined)).toBe("Unknown");
    expect(formatAuthProvider("other")).toBe("other");
  });
});
