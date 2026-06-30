import { describe, expect, it } from "vitest";

import User from "@/models/User.ts";
import Relationship from "@/models/Relationship.ts";
import * as userService from "@/lib/services/userService.ts";
import * as horseService from "@/lib/services/horseService.ts";
import * as trainerService from "@/lib/services/trainerService.ts";

const minimalAddress = {
  country: "Portugal",
  city: "Lisbon",
  street: "Main St",
  postCode: "1000",
};

async function createUser(email: string) {
  return userService.createCredentialsUser({
    email,
    password: "TestPass1!",
    firstName: "Trainer",
  });
}

describe("trainerService", () => {
  it("creates trainer with userId and sets trainerProfileId on User", async () => {
    const owner = await createUser("trainer-create-owner@example.com");

    const trainer = await trainerService.createTrainer(String(owner._id), {
      displayName: "Alex Coach",
      bio: "Dressage and jumping instruction",
      email: "coach@example.com",
      phoneNumber: "+351912345678",
      address: minimalAddress,
    });

    expect(String(trainer.userId)).toBe(String(owner._id));
    expect(trainer.displayName).toBe("Alex Coach");
    expect(trainer.isPublic).toBe(true);
    expect(trainer.acceptsNewClients).toBe(true);

    const user = await User.findById(owner._id).lean();
    expect(String(user?.trainerProfileId)).toBe(String(trainer._id));
  });

  it("rejects second trainer create for the same user", async () => {
    const owner = await createUser("trainer-duplicate@example.com");

    await trainerService.createTrainer(String(owner._id), {
      displayName: "First Trainer",
      bio: "First profile",
      email: "first@example.com",
      phoneNumber: "+351911111111",
      address: minimalAddress,
    });

    await expect(
      trainerService.createTrainer(String(owner._id), {
        displayName: "Second Trainer",
        bio: "Should fail",
        email: "second@example.com",
        phoneNumber: "+351922222222",
        address: minimalAddress,
      }),
    ).rejects.toMatchObject({ statusCode: 409, code: "CONFLICT" });
  });

  it("updates discovery settings only for profile owner", async () => {
    const owner = await createUser("trainer-discovery-owner@example.com");
    const outsider = await createUser("trainer-outsider@example.com");
    const created = await trainerService.createTrainer(String(owner._id), {
      displayName: "Private Trainer",
      bio: "Invite only",
      email: "private@example.com",
      phoneNumber: "+351933333333",
      address: minimalAddress,
    });

    await expect(
      trainerService.updateTrainerDiscovery(String(outsider._id), String(created._id), {
        isPublic: false,
      }),
    ).rejects.toMatchObject({ statusCode: 404 });

    const updated = await trainerService.updateTrainerDiscovery(
      String(owner._id),
      String(created._id),
      {
        isPublic: false,
        acceptsNewClients: false,
      },
    );

    expect(updated.isPublic).toBe(false);
    expect(updated.acceptsNewClients).toBe(false);
  });

  it("returns public trainer card with business contact", async () => {
    const owner = await createUser("trainer-public@example.com");
    const created = await trainerService.createTrainer(String(owner._id), {
      displayName: "Public Trainer",
      bio: "Open listing",
      email: "public@example.com",
      phoneNumber: "+351944444444",
      address: minimalAddress,
    });

    const card = await trainerService.getPublicTrainerCard(String(created._id), {
      isAuthenticated: false,
    });

    expect(card.displayName).toBe("Public Trainer");
    expect(card.contact.email).toBe("public@example.com");
    expect(card.contact.phone).toBe("+351944444444");
  });

  it("allows horse owner with accepted trainer relationship to view non-public trainer", async () => {
    const horseOwner = await createUser("trainer-rel-horse-owner@example.com");
    const trainerOwner = await createUser("trainer-rel-owner@example.com");
    const trainer = await trainerService.createTrainer(String(trainerOwner._id), {
      displayName: "Relationship Trainer",
      bio: "Trains Comet",
      email: "rel@example.com",
      phoneNumber: "+351955555555",
      address: minimalAddress,
      isPublic: false,
    });

    const horse = await horseService.createHorse(String(horseOwner._id), {
      name: "Comet",
      breed: "Lusitano",
      sex: "Gelding",
    });

    await Relationship.create({
      horseId: horse._id,
      relationshipType: "trainer",
      status: "accepted",
      requesterUserId: horseOwner._id,
      receiverUserId: trainerOwner._id,
      receiverAccountType: "trainer",
      receiverAccountId: trainer._id,
    });

    const card = await trainerService.getPublicTrainerCard(String(trainer._id), {
      isAuthenticated: true,
      id: String(horseOwner._id),
    });

    expect(card.id).toBe(String(trainer._id));
  });
});
