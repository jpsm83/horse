import { describe, expect, it } from "vitest";
import mongoose from "mongoose";

import Horse from "@/models/Horse.ts";
import User from "@/models/User.ts";
import * as navigationService from "@/lib/services/navigationService.ts";
import * as userService from "@/lib/services/userService.ts";
import {
  createTestBreeder,
  createTestRidingClub,
  createTestStable,
  createTestTransport,
} from "@/tests/helpers/businessRoleFixtures.ts";

async function createUser(email: string) {
  return userService.createCredentialsUser({
    email,
    password: "TestPass1!",
    firstName: "Nav",
  });
}

describe("navigationService", () => {
  it("returns all false when the user does not exist", async () => {
    const owned = await navigationService.getUserOwnedNavigation(
      new mongoose.Types.ObjectId().toString(),
    );

    expect(owned).toEqual({
      stables: false,
      veterinaries: false,
      transport: false,
      breeders: false,
      coaches: false,
      horses: false,
      ridingClubs: false,
      trainers: false,
      groomers: false,
      farriers: false,
      riders: false,
    });
  });

  it("reflects entity-owned profiles and horses via entity queries", async () => {
    const user = await createUser("nav-owner@example.com");
    await createTestStable(user._id);

    await User.findByIdAndUpdate(user._id, {
      $set: {
        trainerProfileId: new mongoose.Types.ObjectId(),
        coachProfileId: new mongoose.Types.ObjectId(),
      },
    });

    await Horse.create({
      name: "Nav Test Horse",
      breed: "Lusitano",
      sex: "Gelding",
      mainOwnerUserId: user._id,
      createdByUserId: user._id,
    });

    const owned = await navigationService.getUserOwnedNavigation(String(user._id));

    expect(owned.stables).toBe(true);
    expect(owned.trainers).toBe(true);
    expect(owned.coaches).toBe(true);
    expect(owned.horses).toBe(true);
    expect(owned.veterinaries).toBe(false);
    expect(owned.transport).toBe(false);
    expect(owned.breeders).toBe(false);
    expect(owned.ridingClubs).toBe(false);
  });

  it("reflects riding club and transport when mainOwnerUserId matches", async () => {
    const user = await createUser("nav-host@example.com");
    await createTestRidingClub(user._id);
    await createTestTransport(user._id);

    const owned = await navigationService.getUserOwnedNavigation(String(user._id));

    expect(owned.ridingClubs).toBe(true);
    expect(owned.transport).toBe(true);
    expect(owned.stables).toBe(false);
  });

  it("reflects breederProfileId on the user document", async () => {
    const user = await createUser("nav-breeder@example.com");
    const breeder = await createTestBreeder(user._id);

    await User.findByIdAndUpdate(user._id, {
      $set: { breederProfileId: breeder._id },
    });

    const owned = await navigationService.getUserOwnedNavigation(String(user._id));

    expect(owned.breeders).toBe(true);
    expect(owned.stables).toBe(false);
  });

  it("reflects stable and riding club when user is co-owner", async () => {
    const mainOwner = await createUser("nav-main@example.com");
    const coOwner = await createUser("nav-co@example.com");

    await createTestStable(mainOwner._id, {
      coOwners: [{ userId: coOwner._id, ownershipPercentage: 30 }],
    });
    await createTestRidingClub(mainOwner._id, {
      coOwners: [{ userId: coOwner._id, ownershipPercentage: 25 }],
    });

    const owned = await navigationService.getUserOwnedNavigation(String(coOwner._id));

    expect(owned.stables).toBe(true);
    expect(owned.ridingClubs).toBe(true);
    expect(owned.horses).toBe(false);
  });

  it("reflects position-linked profile ids on the user document", async () => {
    const user = await createUser("nav-groom@example.com");

    await User.findByIdAndUpdate(user._id, {
      $set: {
        groomProfileId: new mongoose.Types.ObjectId(),
        farrierProfileId: new mongoose.Types.ObjectId(),
        riderProfileId: new mongoose.Types.ObjectId(),
      },
    });

    const owned = await navigationService.getUserOwnedNavigation(String(user._id));

    expect(owned.groomers).toBe(true);
    expect(owned.farriers).toBe(true);
    expect(owned.riders).toBe(true);
    expect(owned.stables).toBe(false);
  });
});
