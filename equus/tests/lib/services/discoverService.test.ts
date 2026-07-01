import { describe, expect, it } from "vitest";

import Horse from "@/models/Horse.ts";
import Relationship from "@/models/Relationship.ts";
import * as userService from "@/lib/services/userService.ts";
import * as discoverService from "@/lib/services/discoverService.ts";
import { ApiError } from "@/lib/api/errors.ts";
import {
  createTestStable,
  createTestVeterinary,
} from "../../helpers/businessRoleFixtures.ts";

async function createUser(email: string) {
  return userService.createCredentialsUser({
    email,
    password: "TestPass1!",
    firstName: "Discover",
  });
}

describe("discoverService", () => {
  it("returns public stables matching search query", async () => {
    const owner = await createUser("discover-owner@example.com");
    const stableOwner = await createUser("discover-stable@example.com");
    await createTestStable(String(stableOwner._id), { tradeName: "Sunrise Stables" });
    await createTestStable(String(stableOwner._id), { tradeName: "Valley Barn" });

    const results = await discoverService.searchDiscoverProviders(String(owner._id), {
      type: "stable",
      q: "Sunrise",
      limit: 20,
      scope: "horse",
    });

    expect(results.some((entry) => entry.label === "Sunrise Stables")).toBe(true);
    expect(results.some((entry) => entry.label === "Valley Barn")).toBe(false);
  });

  it("excludes profiles operated by the requester", async () => {
    const owner = await createUser("discover-self@example.com");
    await createTestStable(String(owner._id), { tradeName: "My Own Stable" });

    const results = await discoverService.searchDiscoverProviders(String(owner._id), {
      type: "stable",
      q: "My Own",
      limit: 20,
      scope: "horse",
    });

    expect(results).toHaveLength(0);
  });

  it("includes non-public veterinary when requester has accepted relationship", async () => {
    const owner = await createUser("discover-vet-owner@example.com");
    const vetUser = await createUser("discover-vet@example.com");
    const horse = await Horse.create({
      name: "Star",
      breed: "Thoroughbred",
      sex: "Mare",
      mainOwnerUserId: owner._id,
      createdByUserId: owner._id,
    });
    const veterinary = await createTestVeterinary(String(vetUser._id), {
      practiceName: "Hidden Vet Practice",
      isPublic: false,
    });

    await Relationship.create({
      horseId: horse._id,
      relationshipType: "veterinary",
      status: "accepted",
      requesterUserId: owner._id,
      receiverUserId: vetUser._id,
      receiverAccountType: "veterinary",
      receiverAccountId: veterinary._id,
    });

    const results = await discoverService.searchDiscoverProviders(String(owner._id), {
      type: "veterinary",
      q: "Hidden",
      limit: 20,
      scope: "horse",
    });

    expect(results.some((entry) => entry.id === String(veterinary._id))).toBe(true);
  });

  it("rejects host scope for entity-owned types", async () => {
    const owner = await createUser("discover-scope@example.com");

    await expect(
      discoverService.searchDiscoverProviders(String(owner._id), {
        type: "stable",
        limit: 20,
        scope: "host",
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("allows host scope for service types", async () => {
    const owner = await createUser("discover-host-scope@example.com");
    const groomUser = await createUser("discover-groom@example.com");
    const { createTestGroom } = await import("../../helpers/businessRoleFixtures.ts");
    await createTestGroom(String(groomUser._id), { displayName: "Carla Groom" });

    const results = await discoverService.searchDiscoverProviders(String(owner._id), {
      type: "groom",
      q: "Carla",
      limit: 20,
      scope: "host",
    });

    expect(results.some((entry) => entry.label === "Carla Groom")).toBe(true);
  });

  it("excludes inactive provider profiles from search", async () => {
    const owner = await createUser("discover-inactive-stable@example.com");
    const stableOwner = await createUser("discover-inactive-stable-owner@example.com");
    await createTestStable(String(stableOwner._id), {
      tradeName: "Closed Barn",
      isActive: false,
    });

    const results = await discoverService.searchDiscoverProviders(String(owner._id), {
      type: "stable",
      q: "Closed",
      limit: 20,
      scope: "horse",
    });

    expect(results).toHaveLength(0);
  });

  it("excludes profiles operated by deactivated users", async () => {
    const owner = await createUser("discover-deactivated-owner@example.com");
    const stableOwner = await createUser("discover-deactivated-stable-owner@example.com");
    await createTestStable(String(stableOwner._id), { tradeName: "Ghost Barn" });
    await userService.softDelete(String(stableOwner._id));

    const results = await discoverService.searchDiscoverProviders(String(owner._id), {
      type: "stable",
      q: "Ghost",
      limit: 20,
      scope: "horse",
    });

    expect(results).toHaveLength(0);
  });
});
