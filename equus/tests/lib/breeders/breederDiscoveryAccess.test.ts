import { describe, expect, it } from "vitest";

import { canViewBreederDiscovery } from "@/lib/breeders/breederDiscoveryAccess.ts";

describe("breederDiscoveryAccess", () => {
  const mainOwnerId = "507f1f77bcf86cd799439011";
  const coOwnerId = "507f1f77bcf86cd799439012";

  it("allows public breeders for anyone", () => {
    const breeder = { isPublic: true };
    expect(canViewBreederDiscovery(breeder, {})).toBe(true);
  });

  it("allows owners regardless of isPublic", () => {
    const breeder = {
      isPublic: false,
      mainOwnerUserId: mainOwnerId,
      coOwners: [{ userId: coOwnerId, ownershipPercentage: 30 }],
    };

    expect(canViewBreederDiscovery(breeder, { requesterUserId: mainOwnerId })).toBe(true);
    expect(canViewBreederDiscovery(breeder, { requesterUserId: coOwnerId })).toBe(true);
  });

  it("restricts non-public breeders to relationship or collaboration context", () => {
    const breeder = { isPublic: false };

    expect(canViewBreederDiscovery(breeder, {})).toBe(false);
    expect(canViewBreederDiscovery(breeder, { hasAcceptedHorseBreederRelationship: true })).toBe(
      true,
    );
    expect(canViewBreederDiscovery(breeder, { hasActiveCollaboration: true })).toBe(true);
  });
});
