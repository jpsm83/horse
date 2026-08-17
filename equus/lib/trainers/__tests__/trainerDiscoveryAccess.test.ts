import { describe, expect, it } from "vitest";

import { canViewTrainerDiscovery } from "@/lib/trainers/trainerDiscoveryAccess.ts";

describe("trainerDiscoveryAccess", () => {
  const ownerId = "507f1f77bcf86cd799439011";

  it("allows public trainers for anyone", () => {
    const trainer = { isPublic: true };
    expect(canViewTrainerDiscovery(trainer, {})).toBe(true);
  });

  it("allows profile owner regardless of isPublic", () => {
    const trainer = {
      isPublic: false,
      userId: ownerId,
    };

    expect(canViewTrainerDiscovery(trainer, { requesterUserId: ownerId })).toBe(true);
  });

  it("restricts non-public trainers to relationship context", () => {
    const trainer = { isPublic: false };

    expect(canViewTrainerDiscovery(trainer, {})).toBe(false);
    expect(
      canViewTrainerDiscovery(trainer, { hasAcceptedHorseTrainerRelationship: true }),
    ).toBe(true);
  });
});
