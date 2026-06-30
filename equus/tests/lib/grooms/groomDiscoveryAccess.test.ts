import { describe, expect, it } from "vitest";

import { canViewGroomDiscovery } from "@/lib/grooms/groomDiscoveryAccess.ts";

describe("groomDiscoveryAccess", () => {
  const ownerId = "507f1f77bcf86cd799439011";

  it("allows public grooms for anyone", () => {
    const groom = { isPublic: true };
    expect(canViewGroomDiscovery(groom, {})).toBe(true);
  });

  it("allows profile owner regardless of isPublic", () => {
    const groom = {
      isPublic: false,
      userId: ownerId,
    };

    expect(canViewGroomDiscovery(groom, { requesterUserId: ownerId })).toBe(true);
  });

  it("restricts non-public grooms to relationship context", () => {
    const groom = { isPublic: false };

    expect(canViewGroomDiscovery(groom, {})).toBe(false);
    expect(canViewGroomDiscovery(groom, { hasAcceptedHorseGroomRelationship: true })).toBe(true);
  });
});
