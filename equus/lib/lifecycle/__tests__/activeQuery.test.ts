import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/errors.ts";
import {
  activeOnlyFilter,
  assertDocumentActive,
  isDocumentActive,
  mergeActiveOnly,
} from "@/lib/lifecycle/activeQuery.ts";

describe("activeQuery", () => {
  it("mergeActiveOnly adds isActive filter", () => {
    expect(mergeActiveOnly({ horseId: "abc" })).toEqual({
      horseId: "abc",
      ...activeOnlyFilter,
    });
  });

  it("isDocumentActive treats missing isActive as active", () => {
    expect(isDocumentActive({})).toBe(true);
    expect(isDocumentActive({ isActive: true })).toBe(true);
    expect(isDocumentActive({ isActive: false })).toBe(false);
    expect(isDocumentActive(null)).toBe(false);
  });

  it("assertDocumentActive throws 404 for tombstoned docs", () => {
    expect(() => assertDocumentActive({ isActive: false }, "Horse")).toThrow(ApiError);
    expect(() => assertDocumentActive({ isActive: false }, "Horse")).toThrow(
      expect.objectContaining({ statusCode: 404 }),
    );
  });

  it("assertDocumentActive passes for active docs", () => {
    const doc = { isActive: true, name: "Duchess" };
    expect(() => assertDocumentActive(doc, "Horse")).not.toThrow();
    assertDocumentActive(doc, "Horse");
    expect(doc.name).toBe("Duchess");
  });
});
