import { describe, expect, it } from "vitest";

import { canViewCoachDiscovery } from "@/lib/coaches/coachDiscoveryAccess.ts";

describe("coachDiscoveryAccess", () => {
  const ownerId = "507f1f77bcf86cd799439011";

  it("allows public coaches for anyone", () => {
    const coach = { isPublic: true };
    expect(canViewCoachDiscovery(coach, {})).toBe(true);
  });

  it("allows profile owner regardless of isPublic", () => {
    const coach = {
      isPublic: false,
      userId: ownerId,
    };

    expect(canViewCoachDiscovery(coach, { requesterUserId: ownerId })).toBe(true);
  });

  it("restricts non-public coaches to relationship context", () => {
    const coach = { isPublic: false };

    expect(canViewCoachDiscovery(coach, {})).toBe(false);
    expect(
      canViewCoachDiscovery(coach, { hasAcceptedHorseCoachRelationship: true }),
    ).toBe(true);
  });
});
