import { describe, expect, it } from "vitest";

import User from "@/models/User.ts";
import Relationship from "@/models/Relationship.ts";
import * as userService from "@/lib/services/userService.ts";
import * as horseService from "@/lib/services/horseService.ts";
import * as groomService from "@/lib/services/groomService.ts";

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
    firstName: "Groom",
  });
}

describe("groomService", () => {
  it("creates groom with userId and sets groomProfileId on User", async () => {
    const owner = await createUser("groom-create-owner@example.com");

    const groom = await groomService.createGroom(String(owner._id), {
      displayName: "Carla Groom",
      email: "groom@example.com",
      bio: "Professional barn groom",
      phoneNumber: "+351912345678",
      address: minimalAddress,
    });

    expect(String(groom.userId)).toBe(String(owner._id));
    expect(groom.displayName).toBe("Carla Groom");
    expect(groom.isPublic).toBe(true);
    expect(groom.acceptsNewClients).toBe(true);

    const user = await User.findById(owner._id).lean();
    expect(String(user?.groomProfileId)).toBe(String(groom._id));
  });

  it("creates groom with only required fields", async () => {
    const owner = await createUser("groom-minimal@example.com");

    const groom = await groomService.createGroom(String(owner._id), {
      displayName: "Minimal Groom",
      email: "minimal@example.com",
    });

    expect(groom.displayName).toBe("Minimal Groom");
    expect(groom.bio).toBeUndefined();
    expect(groom.phoneNumber).toBeUndefined();
  });

  it("rejects second groom create for the same user", async () => {
    const owner = await createUser("groom-duplicate@example.com");

    await groomService.createGroom(String(owner._id), {
      displayName: "First Groom",
      email: "first@example.com",
    });

    await expect(
      groomService.createGroom(String(owner._id), {
        displayName: "Second Groom",
        email: "second@example.com",
      }),
    ).rejects.toMatchObject({ statusCode: 409, code: "CONFLICT" });
  });

  it("updates discovery settings only for profile owner", async () => {
    const owner = await createUser("groom-discovery-owner@example.com");
    const outsider = await createUser("groom-outsider@example.com");
    const created = await groomService.createGroom(String(owner._id), {
      displayName: "Private Groom",
      email: "private@example.com",
    });

    await expect(
      groomService.updateGroomDiscovery(String(outsider._id), String(created._id), {
        isPublic: false,
      }),
    ).rejects.toMatchObject({ statusCode: 404 });

    const updated = await groomService.updateGroomDiscovery(
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

  it("returns public groom card with business contact", async () => {
    const owner = await createUser("groom-public@example.com");
    const created = await groomService.createGroom(String(owner._id), {
      displayName: "Public Groom",
      email: "public@example.com",
      phoneNumber: "+351944444444",
    });

    const card = await groomService.getPublicGroomCard(String(created._id), {
      isAuthenticated: false,
    });

    expect(card.displayName).toBe("Public Groom");
    expect(card.contact.email).toBe("public@example.com");
    expect(card.contact.phone).toBe("+351944444444");
  });

  it("allows horse owner with accepted groom relationship to view non-public groom", async () => {
    const horseOwner = await createUser("groom-rel-horse-owner@example.com");
    const groomOwner = await createUser("groom-rel-owner@example.com");
    const groom = await groomService.createGroom(String(groomOwner._id), {
      displayName: "Relationship Groom",
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
      relationshipType: "groom",
      status: "accepted",
      requesterUserId: horseOwner._id,
      receiverUserId: groomOwner._id,
      receiverAccountType: "groom",
      receiverAccountId: groom._id,
    });

    const card = await groomService.getPublicGroomCard(String(groom._id), {
      isAuthenticated: true,
      id: String(horseOwner._id),
    });

    expect(card.id).toBe(String(groom._id));
  });
});
