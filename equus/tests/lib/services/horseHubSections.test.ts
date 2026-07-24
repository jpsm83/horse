import { describe, expect, it } from "vitest";

import { buildHorseHubSections } from "@/lib/services/horseService.ts";
import type { HorseViewerAudience } from "@/lib/horses/horseVisibilityAccess.ts";

const guest: HorseViewerAudience = {
  isOwnerTeam: false,
  isRelationshipAudience: false,
};
const related: HorseViewerAudience = {
  isOwnerTeam: false,
  isRelationshipAudience: true,
};
const ownerTeam: HorseViewerAudience = {
  isOwnerTeam: true,
  isRelationshipAudience: true,
};

describe("buildHorseHubSections", () => {
  const horse = {
    _id: "507f1f77bcf86cd799439011",
    color: "Bay",
    heightHands: 16,
    disciplines: ["Dressage"],
    description: "Friendly",
    registryId: "REG-1",
    microchipId: "CHIP-1",
    passportNumber: "PASS-1",
    coOwners: [{ userId: "x" }],
    pedigree: { sireName: "Sire", damName: "Dam" },
    hubSections: {
      identity: { mode: "public" },
      identification: { mode: "relationship" },
      pedigree: { mode: "relationship" },
      about: { mode: "owner" },
      ownership: { mode: "relationship" },
    },
  };

  it("omits forbidden sections for guests independently", () => {
    const sections = buildHorseHubSections(horse, guest);
    expect(sections.identity).toBeDefined();
    expect(sections.identification).toBeUndefined();
    expect(sections.pedigree).toBeUndefined();
    expect(sections.about).toBeUndefined();
    expect(sections.ownership).toBeUndefined();
  });

  it("includes relationship sections for related viewers", () => {
    const sections = buildHorseHubSections(horse, related);
    expect(sections.identity).toBeDefined();
    expect(sections.identification?.registryId).toBe("REG-1");
    expect(sections.pedigree?.sireName).toBe("Sire");
    expect(sections.about).toBeUndefined();
    expect(sections.ownership).toEqual({ coOwnerCount: 1, soleOwner: false });
  });

  it("includes all sections for owner team", () => {
    const sections = buildHorseHubSections(horse, ownerTeam);
    expect(Object.keys(sections).sort()).toEqual([
      "about",
      "identification",
      "identity",
      "ownership",
      "pedigree",
    ]);
    expect(sections.about?.description).toBe("Friendly");
  });
});
