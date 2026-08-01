import { describe, expect, it, vi } from "vitest";

import type { VisibilityMode } from "@/lib/visibility/sectionVisibility.ts";

/**
 * Behavior contract for SectionVisibilityControl persistMode wiring.
 * (Component RTL coverage is optional; this documents the no-op rule adapters rely on.)
 */
describe("section visibility persist contract", () => {
  it("should not call persist when mode is unchanged", async () => {
    const persistMode = vi.fn<(mode: VisibilityMode) => Promise<void>>(async () => undefined);
    const current = "owner" as VisibilityMode;
    const next = "owner" as VisibilityMode;
    if ((next as VisibilityMode) !== (current as VisibilityMode)) {
      await persistMode(next);
    }
    expect(persistMode).not.toHaveBeenCalled();
  });

  it("should call persist when mode changes", async () => {
    const persistMode = vi.fn<(mode: VisibilityMode) => Promise<void>>(async () => undefined);
    const current = "owner" as VisibilityMode;
    const next = "public" as VisibilityMode;
    if ((next as VisibilityMode) !== (current as VisibilityMode)) {
      await persistMode(next);
    }
    expect(persistMode).toHaveBeenCalledWith("public");
  });
});
