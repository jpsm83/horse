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
import * as trainerService from "@/lib/services/trainerService.ts";
import * as groomService from "@/lib/services/groomService.ts";
import * as coachService from "@/lib/services/coachService.ts";
import * as farrierService from "@/lib/services/farrierService.ts";
import * as riderService from "@/lib/services/riderService.ts";
import * as veterinaryService from "@/lib/services/veterinaryService.ts";

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

  it("reflects owned breeder via mainOwnerUserId query", async () => {
    const user = await createUser("nav-breeder@example.com");
    await createTestBreeder(user._id);

    const owned = await navigationService.getUserOwnedNavigation(String(user._id));

    expect(owned.breeders).toBe(true);
    expect(owned.stables).toBe(false);
  });

  it("reflects trainer after createTrainer sets trainerProfileId", async () => {
    const user = await createUser("nav-trainer-create@example.com");

    await trainerService.createTrainer(String(user._id), {
      displayName: "Nav Trainer",
      bio: "Navigation test trainer",
      email: "nav-trainer@example.com",
      phoneNumber: "+351988888888",
      address: {
        country: "Portugal",
        city: "Lisbon",
        street: "Main St",
        postCode: "1000",
      },
    });

    const owned = await navigationService.getUserOwnedNavigation(String(user._id));

    expect(owned.trainers).toBe(true);
    expect(owned.stables).toBe(false);
  });

  it("reflects groom after createGroom sets groomProfileId", async () => {
    const user = await createUser("nav-groom-create@example.com");

    await groomService.createGroom(String(user._id), {
      displayName: "Nav Groom",
      email: "nav-groom@example.com",
    });

    const owned = await navigationService.getUserOwnedNavigation(String(user._id));

    expect(owned.groomers).toBe(true);
    expect(owned.stables).toBe(false);
  });

  it("reflects coach after createCoach sets coachProfileId", async () => {
    const user = await createUser("nav-coach-create@example.com");

    await coachService.createCoach(String(user._id), {
      displayName: "Nav Coach",
      bio: "Navigation test coach",
      email: "nav-coach@example.com",
      phoneNumber: "+351977777777",
      address: {
        country: "Portugal",
        city: "Lisbon",
        street: "Main St",
        postCode: "1000",
      },
    });

    const owned = await navigationService.getUserOwnedNavigation(String(user._id));

    expect(owned.coaches).toBe(true);
    expect(owned.stables).toBe(false);
  });

  it("reflects farrier after createFarrier sets farrierProfileId", async () => {
    const user = await createUser("nav-farrier-create@example.com");

    await farrierService.createFarrier(String(user._id), {
      displayName: "Nav Farrier",
      email: "nav-farrier@example.com",
    });

    const owned = await navigationService.getUserOwnedNavigation(String(user._id));

    expect(owned.farriers).toBe(true);
    expect(owned.stables).toBe(false);
  });

  it("reflects rider after createRider sets riderProfileId", async () => {
    const user = await createUser("nav-rider-create@example.com");

    await riderService.createRider(String(user._id), {
      displayName: "Nav Rider",
      email: "nav-rider@example.com",
    });

    const owned = await navigationService.getUserOwnedNavigation(String(user._id));

    expect(owned.riders).toBe(true);
    expect(owned.stables).toBe(false);
  });

  it("reflects veterinaries after createVeterinary sets veterinaryProfileId", async () => {
    const user = await createUser("nav-vet-create@example.com");

    await veterinaryService.createVeterinary(String(user._id), {
      practiceName: "Nav Vet Practice",
      description: "Navigation test veterinary",
      email: "nav-vet@example.com",
      phoneNumber: "+351912345678",
      address: {
        country: "Portugal",
        city: "Lisbon",
        street: "Main St",
        postCode: "1000",
      },
    });

    const owned = await navigationService.getUserOwnedNavigation(String(user._id));

    expect(owned.veterinaries).toBe(true);
    expect(owned.stables).toBe(false);
  });

  it("reflects breeder when user is co-owner", async () => {
    const mainOwner = await createUser("nav-breeder-main@example.com");
    const coOwner = await createUser("nav-breeder-co@example.com");

    await createTestBreeder(mainOwner._id, {
      coOwners: [{ userId: coOwner._id, ownershipPercentage: 40 }],
    });

    const owned = await navigationService.getUserOwnedNavigation(String(coOwner._id));

    expect(owned.breeders).toBe(true);
  });

  it("reflects transport when user is co-owner", async () => {
    const mainOwner = await createUser("nav-transport-main@example.com");
    const coOwner = await createUser("nav-transport-co@example.com");

    await createTestTransport(mainOwner._id, {
      coOwners: [{ userId: coOwner._id, ownershipPercentage: 35 }],
    });

    const owned = await navigationService.getUserOwnedNavigation(String(coOwner._id));

    expect(owned.transport).toBe(true);
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
