import { describe, expect, it } from "vitest";

import { canViewTransportDiscovery } from "@/lib/transports/transportDiscoveryAccess.ts";

describe("transportDiscoveryAccess", () => {
  const mainOwnerId = "507f1f77bcf86cd799439011";
  const coOwnerId = "507f1f77bcf86cd799439012";

  it("allows public transport companies for anyone", () => {
    const transport = { isPublic: true };
    expect(canViewTransportDiscovery(transport, {})).toBe(true);
  });

  it("allows owner and co-owner regardless of isPublic", () => {
    const transport = {
      isPublic: false,
      mainOwnerUserId: mainOwnerId,
      coOwners: [{ userId: coOwnerId, ownershipPercentage: 30 }],
    };

    expect(canViewTransportDiscovery(transport, { requesterUserId: mainOwnerId })).toBe(true);
    expect(canViewTransportDiscovery(transport, { requesterUserId: coOwnerId })).toBe(true);
  });

  it("restricts non-public transport to relationship or collaboration context", () => {
    const transport = { isPublic: false };

    expect(canViewTransportDiscovery(transport, {})).toBe(false);
    expect(
      canViewTransportDiscovery(transport, { hasAcceptedHorseTransportRelationship: true }),
    ).toBe(true);
    expect(canViewTransportDiscovery(transport, { hasActiveCollaboration: true })).toBe(true);
  });
});
