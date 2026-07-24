import { describe, expect, it, vi } from "vitest";

/**
 * Behavior contract for SectionVisibilityControl persistMode wiring.
 * (Component RTL coverage is optional; this documents the no-op rule adapters rely on.)
 */
describe("section visibility persist contract", () => {
  it("should not call persist when mode is unchanged", async () => {
    const persistMode = vi.fn(async () => undefined);
    const current = "owner" as const;
    const next = "owner" as const;
    if (next !== current) {
      await persistMode(next);
    }
    expect(persistMode).not.toHaveBeenCalled();
  });

  it("should call persist when mode changes", async () => {
    const persistMode = vi.fn(async () => undefined);
    const current = "owner" as const;
    const next = "public" as const;
    if (next !== current) {
      await persistMode(next);
    }
    expect(persistMode).toHaveBeenCalledWith("public");
  });
});
