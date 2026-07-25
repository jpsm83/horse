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

  it("includes all profile sections for owner team", () => {
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

  it("includes bloodlineNotes in pedigree when present", () => {
    const withNotes = {
      ...horse,
      pedigree: { sireName: "Sire", damName: "Dam", bloodlineNotes: "Warmblood line" },
      hubSections: { ...horse.hubSections, pedigree: { mode: "public" } },
    };
    const sections = buildHorseHubSections(withNotes, guest);
    expect(sections.pedigree?.bloodlineNotes).toBe("Warmblood line");
  });
});

describe("deriveAllowedTabs", () => {
  it("guest gets only public tabs", () => {
    const tabs = deriveAllowedTabs("guest");
    const expected: HorseTab[] = ["hub", "planning", "media", "documents"];
    expect(tabs.sort()).toEqual(expected.sort());
  });

  it("public role gets same tabs as guest", () => {
    expect(deriveAllowedTabs("public").sort()).toEqual(deriveAllowedTabs("guest").sort());
  });

  it("related role gets same tabs as guest/public", () => {
    expect(deriveAllowedTabs("related").sort()).toEqual(deriveAllowedTabs("guest").sort());
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
