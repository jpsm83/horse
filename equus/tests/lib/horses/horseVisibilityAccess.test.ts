import { describe, expect, it } from "vitest";

import {
  canAccessByVisibilityMode,
  canViewHorseGlobal,
  canViewHorseHubSection,
  type HorseViewerAudience,
} from "@/lib/horses/horseVisibilityAccess.ts";
import { canViewHorseDiscovery } from "@/lib/horses/horseDiscoveryAccess.ts";

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

describe("horseVisibilityAccess", () => {
  const mainOwnerId = "507f1f77bcf86cd799439011";
  const coOwnerId = "507f1f77bcf86cd799439012";
  const responsibleId = "507f1f77bcf86cd799439014";

  describe("canAccessByVisibilityMode", () => {
    it("public allows everyone", () => {
      expect(canAccessByVisibilityMode("public", guest)).toBe(true);
      expect(canAccessByVisibilityMode("public", related)).toBe(true);
      expect(canAccessByVisibilityMode("public", ownerTeam)).toBe(true);
    });

    it("relationship allows owner team and relationship audience only", () => {
      expect(canAccessByVisibilityMode("relationship", guest)).toBe(false);
      expect(canAccessByVisibilityMode("relationship", related)).toBe(true);
      expect(canAccessByVisibilityMode("relationship", ownerTeam)).toBe(true);
    });

    it("owner allows owner team only", () => {
      expect(canAccessByVisibilityMode("owner", guest)).toBe(false);
      expect(canAccessByVisibilityMode("owner", related)).toBe(false);
      expect(canAccessByVisibilityMode("owner", ownerTeam)).toBe(true);
    });

    it("accepts legacy owner_only alias", () => {
      expect(canAccessByVisibilityMode("owner_only", related)).toBe(false);
      expect(canAccessByVisibilityMode("owner_only", ownerTeam)).toBe(true);
    });
  });

  describe("canViewHorseGlobal", () => {
    it("allows public horses for guests", () => {
      expect(canViewHorseGlobal({ profileVisibility: "public" }, guest)).toBe(true);
    });

    it("gates relationship and owner modes", () => {
      expect(canViewHorseGlobal({ profileVisibility: "relationship" }, guest)).toBe(false);
      expect(canViewHorseGlobal({ profileVisibility: "relationship" }, related)).toBe(true);
      expect(canViewHorseGlobal({ profileVisibility: "owner" }, related)).toBe(false);
      expect(canViewHorseGlobal({ profileVisibility: "owner" }, ownerTeam)).toBe(true);
    });
  });

  describe("canViewHorseHubSection", () => {
    const horse = {
      hubSections: {
        identity: { mode: "public" },
        identification: { mode: "relationship" },
        pedigree: { mode: "relationship" },
        about: { mode: "owner" },
        ownership: { mode: "relationship" },
      },
    };

    it("omits forbidden sections by mode", () => {
      expect(canViewHorseHubSection(horse, "identity", guest)).toBe(true);
      expect(canViewHorseHubSection(horse, "identification", guest)).toBe(false);
      expect(canViewHorseHubSection(horse, "identification", related)).toBe(true);
      expect(canViewHorseHubSection(horse, "pedigree", guest)).toBe(false);
      expect(canViewHorseHubSection(horse, "pedigree", related)).toBe(true);
      expect(canViewHorseHubSection(horse, "about", related)).toBe(false);
      expect(canViewHorseHubSection(horse, "about", ownerTeam)).toBe(true);
      expect(canViewHorseHubSection(horse, "ownership", related)).toBe(true);
    });

    it("uses defaults when hubSections missing", () => {
      expect(canViewHorseHubSection({}, "identity", guest)).toBe(true);
      expect(canViewHorseHubSection({}, "identification", guest)).toBe(true);
      expect(canViewHorseHubSection({}, "ownership", guest)).toBe(false);
      expect(canViewHorseHubSection({}, "ownership", related)).toBe(true);
    });

    it("maps legacy overview mode onto identity via normalize", () => {
      const legacy = { hubSections: { overview: { mode: "owner" } } };
      expect(canViewHorseHubSection(legacy, "identity", related)).toBe(false);
      expect(canViewHorseHubSection(legacy, "identity", ownerTeam)).toBe(true);
    });
  });

  describe("canViewHorseDiscovery compatibility", () => {
    it("allows owners regardless of visibility", () => {
      const horse = {
        profileVisibility: "owner",
        mainOwnerUserId: mainOwnerId,
        coOwners: [{ userId: coOwnerId, ownershipPercentage: 30 }],
        responsibles: [{ userId: responsibleId }],
      };

      expect(canViewHorseDiscovery(horse, { requesterUserId: mainOwnerId })).toBe(true);
      expect(canViewHorseDiscovery(horse, { requesterUserId: coOwnerId })).toBe(true);
      expect(canViewHorseDiscovery(horse, { requesterUserId: responsibleId })).toBe(true);
      expect(
        canViewHorseDiscovery(horse, {
          requesterUserId: "507f1f77bcf86cd799439013",
          hasAcceptedRelationship: true,
        }),
      ).toBe(false);
    });

    it("allows relationship visibility for relationship/collaboration", () => {
      const horse = { profileVisibility: "relationship" };
      expect(canViewHorseDiscovery(horse, { isAuthenticated: true })).toBe(false);
      expect(canViewHorseDiscovery(horse, { hasAcceptedRelationship: true })).toBe(true);
      expect(canViewHorseDiscovery(horse, { hasActiveCollaboration: true })).toBe(true);
    });
  });
});
