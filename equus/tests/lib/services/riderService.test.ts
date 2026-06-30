import { describe, expect, it } from "vitest";

import User from "@/models/User.ts";
import Relationship from "@/models/Relationship.ts";
import * as userService from "@/lib/services/userService.ts";
import * as horseService from "@/lib/services/horseService.ts";
import * as riderService from "@/lib/services/riderService.ts";

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
    firstName: "Rider",
  });
}

describe("riderService", () => {
  it("creates rider with userId and sets riderProfileId on User", async () => {
    const owner = await createUser("rider-create-owner@example.com");

    const rider = await riderService.createRider(String(owner._id), {
      displayName: "Alex Rider",
      email: "rider@example.com",
      bio: "Professional competition rider",
      phoneNumber: "+351912345678",
      address: minimalAddress,
      disciplines: ["Dressage"],
      competitionHighlights: ["National champion 2024"],
    });

    expect(String(rider.userId)).toBe(String(owner._id));
    expect(rider.displayName).toBe("Alex Rider");
    expect(rider.isPublic).toBe(true);
    expect(rider.acceptsNewClients).toBe(true);
    expect(rider.disciplines).toEqual(["Dressage"]);

    const user = await User.findById(owner._id).lean();
    expect(String(user?.riderProfileId)).toBe(String(rider._id));
  });

  it("creates rider with only required fields", async () => {
    const owner = await createUser("rider-minimal@example.com");

    const rider = await riderService.createRider(String(owner._id), {
      displayName: "Minimal Rider",
      email: "minimal@example.com",
    });

    expect(rider.displayName).toBe("Minimal Rider");
    expect(rider.bio).toBeUndefined();
    expect(rider.phoneNumber).toBeUndefined();
    expect(rider.disciplines).toBeUndefined();
    expect(rider.competitionHighlights).toBeUndefined();
  });

  it("rejects second rider create for the same user", async () => {
    const owner = await createUser("rider-duplicate@example.com");

    await riderService.createRider(String(owner._id), {
      displayName: "First Rider",
      email: "first@example.com",
    });

    await expect(
      riderService.createRider(String(owner._id), {
        displayName: "Second Rider",
        email: "second@example.com",
      }),
    ).rejects.toMatchObject({ statusCode: 409, code: "CONFLICT" });
  });

  it("updates discovery settings only for profile owner", async () => {
    const owner = await createUser("rider-discovery-owner@example.com");
    const outsider = await createUser("rider-outsider@example.com");
    const created = await riderService.createRider(String(owner._id), {
      displayName: "Private Rider",
      email: "private@example.com",
    });

    await expect(
      riderService.updateRiderDiscovery(String(outsider._id), String(created._id), {
        isPublic: false,
      }),
    ).rejects.toMatchObject({ statusCode: 404 });

    const updated = await riderService.updateRiderDiscovery(
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

  it("returns public rider card with business contact", async () => {
    const owner = await createUser("rider-public@example.com");
    const created = await riderService.createRider(String(owner._id), {
      displayName: "Public Rider",
      email: "public@example.com",
      phoneNumber: "+351944444444",
      disciplines: ["Jumping"],
    });

    const card = await riderService.getPublicRiderCard(String(created._id), {
      isAuthenticated: false,
    });

    expect(card.displayName).toBe("Public Rider");
    expect(card.contact.email).toBe("public@example.com");
    expect(card.contact.phone).toBe("+351944444444");
    expect(card.disciplines).toEqual(["Jumping"]);
  });

  it("allows horse owner with accepted rider relationship to view non-public rider", async () => {
    const horseOwner = await createUser("rider-rel-horse-owner@example.com");
    const riderOwner = await createUser("rider-rel-owner@example.com");
    const rider = await riderService.createRider(String(riderOwner._id), {
      displayName: "Relationship Rider",
      email: "rel@example.com",
      isPublic: false,
    });

    const horse = await horseService.createHorse(String(horseOwner._id), {
      name: "Comet",
      breed: "Lusitano",
      sex: "Gelding",
    });

    await Relationship.create({
      horseId: horse._id,
      relationshipType: "rider",
      status: "accepted",
      requesterUserId: horseOwner._id,
      receiverUserId: riderOwner._id,
      receiverAccountType: "rider",
      receiverAccountId: rider._id,
    });

    const card = await riderService.getPublicRiderCard(String(rider._id), {
      isAuthenticated: true,
      id: String(horseOwner._id),
    });

    expect(card.id).toBe(String(rider._id));
  });
});
