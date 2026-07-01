import { describe, expect, it } from "vitest";

import {
  CREATE_ENTITY_ROUTE_SEGMENT,
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
  it("maps CREATE_LINKS to create folder segments (not my href replace)", () => {
    expect(CREATE_LINKS).toHaveLength(MY_OWN_LINKS.length);

    for (const myLink of MY_OWN_LINKS) {
      const createLink = CREATE_LINKS.find((item) => item.key === myLink.key);
      expect(createLink?.href).toBe(`/create/${CREATE_ENTITY_ROUTE_SEGMENT[myLink.key]}`);
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
    expect(CREATE_MENU_HORSE_LINK.href).toBe("/create/horse");
    expect(CREATE_MENU_BUSINESS_LINKS.map((item) => item.href)).toEqual([
      "/create/stable",
      "/create/riding-club",
    ]);
    expect(CREATE_MENU_SERVICE_LINKS.map((item) => item.href)).toEqual([
      "/create/breeder",
      "/create/coache",
      "/create/farrier",
      "/create/groomer",
      "/create/rider",
      "/create/trainer",
      "/create/transport",
      "/create/veterinary",
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
