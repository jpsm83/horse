import { describe, expect, it } from "vitest";

import {
  CREATE_MENU_BUSINESS_LINKS,
  CREATE_MENU_HORSE_LINK,
  CREATE_MENU_SERVICE_LINKS,
  CREATE_LINKS,
  filterHomeSubsectionLinks,
  MY_OWN_LINKS,
  PLURAL_OWNED_CREATE_ENTITIES,
  USER_ACTIVITY_LINKS,
} from "@/components/layout/navigation-config.ts";
import type { UserOwnedNavigation } from "@/lib/services/navigationService.ts";

describe("navigation-config", () => {
  it("maps CREATE_LINKS to /<entity>/new paths", () => {
    expect(CREATE_LINKS).toHaveLength(MY_OWN_LINKS.length);

    for (const myLink of MY_OWN_LINKS) {
      const createLink = CREATE_LINKS.find((item) => item.key === myLink.key);
      expect(createLink?.href).toBe(`${myLink.href.split("?")[0]}/new`);
    }

    const keys = MY_OWN_LINKS.map((item) => item.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("marks multi-ownable entities for plural create copy", () => {
    expect([...PLURAL_OWNED_CREATE_ENTITIES].sort()).toEqual(
      ["horses", "ridingClubs", "stables", "transport"].sort(),
    );
  });

  it("groups create menu links for the user menu", () => {
    expect(CREATE_MENU_HORSE_LINK.href).toBe("/horses/new");
    expect(CREATE_MENU_BUSINESS_LINKS.map((item) => item.href)).toEqual([
      "/stables/new",
      "/riding-clubs/new",
    ]);
    expect(CREATE_MENU_SERVICE_LINKS.map((item) => item.href)).toEqual([
      "/breeders/new",
      "/coaches/new",
      "/farriers/new",
      "/groomers/new",
      "/riders/new",
      "/trainers/new",
      "/transport/new",
      "/veterinaries/new",
    ]);
  });

  it("exposes ownership transfer inbox in user activity links", () => {
    const ownershipLink = USER_ACTIVITY_LINKS.find((item) => item.key === "ownershipTransfers");
    expect(ownershipLink?.href).toBe("/ownership-transfers");
  });

  it("orders home subsection links: businesses, services, horses last", () => {
    const owned: UserOwnedNavigation = {
      stables: true,
      ridingClubs: true,
      breeders: false,
      coaches: true,
      trainers: false,
      groomers: false,
      farriers: false,
      riders: false,
      transport: true,
      veterinaries: false,
      horses: true,
    };

    expect(filterHomeSubsectionLinks(owned).map((item) => item.key)).toEqual([
      "stables",
      "ridingClubs",
      "coaches",
      "transport",
      "horses",
    ]);

    expect(filterHomeSubsectionLinks(null)).toEqual([]);
    expect(filterHomeSubsectionLinks({ ...owned, stables: false, horses: false })).toEqual([
      expect.objectContaining({ key: "ridingClubs" }),
      expect.objectContaining({ key: "coaches" }),
      expect.objectContaining({ key: "transport" }),
    ]);
  });
});
