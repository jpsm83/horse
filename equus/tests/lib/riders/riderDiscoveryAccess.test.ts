import { describe, expect, it } from "vitest";

import { canViewRiderDiscovery } from "@/lib/riders/riderDiscoveryAccess.ts";

describe("riderDiscoveryAccess", () => {
  const ownerId = "507f1f77bcf86cd799439011";

  it("allows public riders for anyone", () => {
    const rider = { isPublic: true };
    expect(canViewRiderDiscovery(rider, {})).toBe(true);
  });

  it("allows profile owner regardless of isPublic", () => {
    const rider = {
      isPublic: false,
      userId: ownerId,
    };

    expect(canViewRiderDiscovery(rider, { requesterUserId: ownerId })).toBe(true);
  });

  it("restricts non-public riders to relationship context", () => {
    const rider = { isPublic: false };

    expect(canViewRiderDiscovery(rider, {})).toBe(false);
    expect(
      canViewRiderDiscovery(rider, { hasAcceptedHorseRiderRelationship: true }),
    ).toBe(true);
  });
});
