import { describe, expect, it } from "vitest";

import { buildHorseHubSections, deriveAllowedTabs, ROLE_ORDER, TAB_MIN_ROLE } from "@/lib/services/horseService.ts";
import type { HorseViewerAudience } from "@/lib/horses/horseVisibilityAccess.ts";
import type { ViewerRole, HorseTab } from "@/lib/services/horseService.ts";

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
    responsibles: [{ userId: "y" }],
    pedigree: { sireName: "Sire", damName: "Dam" },
    saleStatus: "for_sale",
    askingPrice: 12000,
    estimatedValue: 15000,
    valueCurrency: "USD",
    acquisitionDate: new Date("2021-06-01T00:00:00.000Z"),
    hubSections: {
      identity: { mode: "public" },
      identification: { mode: "relationship" },
      pedigree: { mode: "relationship" },
      about: { mode: "owner" },
      ownership: { mode: "relationship" },
      value: { mode: "owner" },
      proactiveRepresentatives: { mode: "owner" },
      coOwnerManagement: { mode: "owner" },
    },
  };

  it("includes identity detail fields for public identity", () => {
    const rich = {
      ...horse,
      registeredName: "Legacy Name",
      dateOfBirth: new Date("2016-05-12T00:00:00.000Z"),
      countryOfBirth: "US",
    };
    const sections = buildHorseHubSections(rich, guest);
    expect(sections.identity?.registeredName).toBe("Legacy Name");
    expect(sections.identity?.countryOfBirth).toBe("US");
    expect(sections.identity?.dateOfBirth).toBeDefined();
    expect(sections.identity?.age).toBeDefined();
  });

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

  it("includes all profile sections for owner team", () => {
    const sections = buildHorseHubSections(horse, ownerTeam);
    expect(Object.keys(sections).sort()).toEqual([
      "about",
      "coOwnerManagement",
      "identification",
      "identity",
      "ownership",
      "pedigree",
      "proactiveRepresentatives",
      "value",
    ]);
    expect(sections.about?.description).toBe("Friendly");
    expect(sections.value?.saleStatus).toBe("for_sale");
    expect(sections.value?.askingPrice).toBe(12000);
    expect(sections.value?.estimatedValue).toBe(15000);
    expect(sections.value?.valueCurrency).toBe("USD");
    expect(sections.proactiveRepresentatives).toEqual({ members: [] });
    expect(sections.coOwnerManagement).toEqual({ members: [] });
  });

  it("includes bloodlineNotes in pedigree when present", () => {
    const withNotes = {
      ...horse,
      pedigree: { sireName: "Sire", damName: "Dam", bloodlineNotes: "Warmblood line" },
      hubSections: { ...horse.hubSections, pedigree: { mode: "public" } },
    };
    const sections = buildHorseHubSections(withNotes, guest);
    expect(sections.pedigree?.bloodlineNotes).toBe("Warmblood line");
  });

  it("includes value section for guests when value is public", () => {
    const publicValue = {
      ...horse,
      hubSections: { ...horse.hubSections, value: { mode: "public" } },
    };
    const sections = buildHorseHubSections(publicValue, guest);
    expect(sections.value).toEqual({
      saleStatus: "for_sale",
      askingPrice: 12000,
      estimatedValue: 15000,
      valueCurrency: "USD",
      acquisitionDate: "2021-06-01T00:00:00.000Z",
    });
  });

  it("omits value section for guests by default (owner mode)", () => {
    const sections = buildHorseHubSections(horse, guest);
    expect(sections.value).toBeUndefined();
  });

  it("includes value section for related viewers when value is relationship", () => {
    const relationshipValue = {
      ...horse,
      hubSections: { ...horse.hubSections, value: { mode: "relationship" } },
    };
    const sections = buildHorseHubSections(relationshipValue, related);
    expect(sections.value?.estimatedValue).toBe(15000);
  });

  it("omits proactive/co-owner sections for guests by default", () => {
    const sections = buildHorseHubSections(horse, guest);
    expect(sections.proactiveRepresentatives).toBeUndefined();
    expect(sections.coOwnerManagement).toBeUndefined();
  });

  it("includes proactive/co-owner sections for guests when public", () => {
    const publicTeam = {
      ...horse,
      hubSections: {
        ...horse.hubSections,
        proactiveRepresentatives: { mode: "public" },
        coOwnerManagement: { mode: "public" },
      },
    };
    const sections = buildHorseHubSections(publicTeam, guest);
    expect(sections.proactiveRepresentatives).toEqual({ members: [] });
    expect(sections.coOwnerManagement).toEqual({ members: [] });
  });
});

describe("deriveAllowedTabs", () => {
  it("guest gets only hub tab", () => {
    const tabs = deriveAllowedTabs("guest");
    expect(tabs).toEqual(["hub"]);
  });

  it("public role gets same tabs as guest", () => {
    expect(deriveAllowedTabs("public").sort()).toEqual(deriveAllowedTabs("guest").sort());
  });

  it("related role gets hub, planning, media, documents", () => {
    const tabs = deriveAllowedTabs("related");
    expect(tabs).toEqual(
      expect.arrayContaining(["hub", "planning", "media", "documents"]),
    );
    expect(tabs).not.toContain("connect");
    expect(tabs).not.toContain("profile");
    expect(tabs).not.toContain("history");
    expect(tabs).not.toContain("admin");
  });

  it("responsible gets all tabs except admin", () => {
    const tabs = deriveAllowedTabs("responsible");
    expect(tabs).toContain("hub");
    expect(tabs).toContain("profile");
    expect(tabs).toContain("connect");
    expect(tabs).toContain("history");
    expect(tabs).not.toContain("admin");
  });

  it("co_owner gets all tabs except admin", () => {
    const tabs = deriveAllowedTabs("co_owner");
    expect(tabs).toContain("profile");
    expect(tabs).not.toContain("admin");
  });

  it("main_owner gets all tabs including admin", () => {
    const tabs = deriveAllowedTabs("main_owner");
    const allTabs = Object.keys(TAB_MIN_ROLE) as HorseTab[];
    expect(tabs.sort()).toEqual(allTabs.sort());
  });

  it("ROLE_ORDER is ordered from lowest to highest privilege", () => {
    const guestIdx = ROLE_ORDER.indexOf("guest");
    const mainOwnerIdx = ROLE_ORDER.indexOf("main_owner");
    expect(guestIdx).toBeLessThan(mainOwnerIdx);
    expect(ROLE_ORDER.indexOf("public")).toBeGreaterThan(guestIdx);
    expect(ROLE_ORDER.indexOf("responsible")).toBeLessThan(mainOwnerIdx);
  });
});
