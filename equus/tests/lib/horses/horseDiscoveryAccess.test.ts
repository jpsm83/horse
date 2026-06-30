import { describe, expect, it } from "vitest";

import { canViewHorseDiscovery } from "@/lib/horses/horseDiscoveryAccess.ts";

describe("horseDiscoveryAccess", () => {
  const mainOwnerId = "507f1f77bcf86cd799439011";
  const coOwnerId = "507f1f77bcf86cd799439012";

  it("allows public horses for anyone", () => {
    const horse = { profileVisibility: "public" };
    expect(canViewHorseDiscovery(horse, { isAuthenticated: false })).toBe(true);
  });

  it("allows relationship visibility only for relationship/collaboration/owners", () => {
    const horse = { profileVisibility: "relationship" };
    expect(canViewHorseDiscovery(horse, { isAuthenticated: true })).toBe(false);
    expect(canViewHorseDiscovery(horse, { hasAcceptedRelationship: true })).toBe(true);
    expect(canViewHorseDiscovery(horse, { hasActiveCollaboration: true })).toBe(true);
  });

  it("allows owners regardless of visibility", () => {
    const horse = {
      profileVisibility: "owner_only",
      mainOwnerUserId: mainOwnerId,
      coOwners: [{ userId: coOwnerId, ownershipPercentage: 30 }],
    };

    expect(canViewHorseDiscovery(horse, { requesterUserId: mainOwnerId })).toBe(true);
    expect(canViewHorseDiscovery(horse, { requesterUserId: coOwnerId })).toBe(true);
    expect(
      canViewHorseDiscovery(horse, {
        requesterUserId: "507f1f77bcf86cd799439013",
        hasAcceptedRelationship: true,
      }),
    ).toBe(false);
  });
});

