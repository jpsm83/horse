import { describe, expect, it } from "vitest";

import { canViewVeterinaryDiscovery } from "@/lib/veterinaries/veterinaryDiscoveryAccess.ts";

describe("veterinaryDiscoveryAccess", () => {
  const ownerId = "507f1f77bcf86cd799439011";

  it("allows public veterinary profiles for anyone", () => {
    const veterinary = { isPublic: true };
    expect(canViewVeterinaryDiscovery(veterinary, {})).toBe(true);
  });

  it("allows profile owner regardless of isPublic", () => {
    const veterinary = {
      isPublic: false,
      userId: ownerId,
    };

    expect(canViewVeterinaryDiscovery(veterinary, { requesterUserId: ownerId })).toBe(true);
  });

  it("restricts non-public veterinary profiles to relationship context", () => {
    const veterinary = { isPublic: false };

    expect(canViewVeterinaryDiscovery(veterinary, {})).toBe(false);
    expect(
      canViewVeterinaryDiscovery(veterinary, { hasAcceptedHorseVeterinaryRelationship: true }),
    ).toBe(true);
  });
});
