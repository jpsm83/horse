import { describe, expect, it } from "vitest";

import { canViewFarrierDiscovery } from "@/lib/farriers/farrierDiscoveryAccess.ts";

describe("farrierDiscoveryAccess", () => {
  const ownerId = "507f1f77bcf86cd799439011";

  it("allows public farriers for anyone", () => {
    const farrier = { isPublic: true };
    expect(canViewFarrierDiscovery(farrier, {})).toBe(true);
  });

  it("allows profile owner regardless of isPublic", () => {
    const farrier = {
      isPublic: false,
      userId: ownerId,
    };

    expect(canViewFarrierDiscovery(farrier, { requesterUserId: ownerId })).toBe(true);
  });

  it("restricts non-public farriers to relationship context", () => {
    const farrier = { isPublic: false };

    expect(canViewFarrierDiscovery(farrier, {})).toBe(false);
    expect(
      canViewFarrierDiscovery(farrier, { hasAcceptedHorseFarrierRelationship: true }),
    ).toBe(true);
  });
});
