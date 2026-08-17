import { describe, expect, it } from "vitest";

import { canViewStableDiscovery } from "@/lib/stables/stableDiscoveryAccess.ts";

describe("stableDiscoveryAccess", () => {
  const mainOwnerId = "507f1f77bcf86cd799439011";
  const coOwnerId = "507f1f77bcf86cd799439012";

  it("allows public stables for anyone", () => {
    const stable = { isPublic: true };
    expect(canViewStableDiscovery(stable, {})).toBe(true);
    expect(canViewStableDiscovery(stable, { requesterUserId: undefined })).toBe(true);
  });

  it("treats missing isPublic as public", () => {
    const stable = {};
    expect(canViewStableDiscovery(stable, {})).toBe(true);
  });

  it("allows owners regardless of isPublic", () => {
    const stable = {
      isPublic: false,
      mainOwnerUserId: mainOwnerId,
      coOwners: [{ userId: coOwnerId, ownershipPercentage: 30 }],
    };

    expect(canViewStableDiscovery(stable, { requesterUserId: mainOwnerId })).toBe(true);
    expect(canViewStableDiscovery(stable, { requesterUserId: coOwnerId })).toBe(true);
  });

  it("restricts non-public stables to relationship or collaboration context", () => {
    const stable = { isPublic: false };

    expect(canViewStableDiscovery(stable, {})).toBe(false);
    expect(canViewStableDiscovery(stable, { hasAcceptedHorseStableRelationship: true })).toBe(
      true,
    );
    expect(canViewStableDiscovery(stable, { hasActiveCollaboration: true })).toBe(true);
  });

  it("does not grant relationship access to unrelated users on non-public stables", () => {
    const stable = { isPublic: false, mainOwnerUserId: mainOwnerId };

    expect(
      canViewStableDiscovery(stable, {
        requesterUserId: "507f1f77bcf86cd799439013",
        hasAcceptedHorseStableRelationship: false,
        hasActiveCollaboration: false,
      }),
    ).toBe(false);
  });
});
