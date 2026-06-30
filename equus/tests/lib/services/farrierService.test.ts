import { describe, expect, it } from "vitest";

import User from "@/models/User.ts";
import Relationship from "@/models/Relationship.ts";
import * as userService from "@/lib/services/userService.ts";
import * as horseService from "@/lib/services/horseService.ts";
import * as farrierService from "@/lib/services/farrierService.ts";

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
    firstName: "Farrier",
  });
}

describe("farrierService", () => {
  it("creates farrier with userId and sets farrierProfileId on User", async () => {
    const owner = await createUser("farrier-create-owner@example.com");

    const farrier = await farrierService.createFarrier(String(owner._id), {
      displayName: "Frank Farrier",
      email: "farrier@example.com",
      bio: "Professional hoof care",
      phoneNumber: "+351912345678",
      address: minimalAddress,
      serviceAreaKm: 50,
    });

    expect(String(farrier.userId)).toBe(String(owner._id));
    expect(farrier.displayName).toBe("Frank Farrier");
    expect(farrier.isPublic).toBe(true);
    expect(farrier.acceptsNewClients).toBe(true);
    expect(farrier.serviceAreaKm).toBe(50);

    const user = await User.findById(owner._id).lean();
    expect(String(user?.farrierProfileId)).toBe(String(farrier._id));
  });

  it("creates farrier with only required fields", async () => {
    const owner = await createUser("farrier-minimal@example.com");

    const farrier = await farrierService.createFarrier(String(owner._id), {
      displayName: "Minimal Farrier",
      email: "minimal@example.com",
    });

    expect(farrier.displayName).toBe("Minimal Farrier");
    expect(farrier.bio).toBeUndefined();
    expect(farrier.phoneNumber).toBeUndefined();
    expect(farrier.serviceAreaKm).toBeUndefined();
  });

  it("rejects second farrier create for the same user", async () => {
    const owner = await createUser("farrier-duplicate@example.com");

    await farrierService.createFarrier(String(owner._id), {
      displayName: "First Farrier",
      email: "first@example.com",
    });

    await expect(
      farrierService.createFarrier(String(owner._id), {
        displayName: "Second Farrier",
        email: "second@example.com",
      }),
    ).rejects.toMatchObject({ statusCode: 409, code: "CONFLICT" });
  });

  it("updates discovery settings only for profile owner", async () => {
    const owner = await createUser("farrier-discovery-owner@example.com");
    const outsider = await createUser("farrier-outsider@example.com");
    const created = await farrierService.createFarrier(String(owner._id), {
      displayName: "Private Farrier",
      email: "private@example.com",
    });

    await expect(
      farrierService.updateFarrierDiscovery(String(outsider._id), String(created._id), {
        isPublic: false,
      }),
    ).rejects.toMatchObject({ statusCode: 404 });

    const updated = await farrierService.updateFarrierDiscovery(
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

  it("returns public farrier card with business contact", async () => {
    const owner = await createUser("farrier-public@example.com");
    const created = await farrierService.createFarrier(String(owner._id), {
      displayName: "Public Farrier",
      email: "public@example.com",
      phoneNumber: "+351944444444",
      serviceAreaKm: 30,
    });

    const card = await farrierService.getPublicFarrierCard(String(created._id), {
      isAuthenticated: false,
    });

    expect(card.displayName).toBe("Public Farrier");
    expect(card.contact.email).toBe("public@example.com");
    expect(card.contact.phone).toBe("+351944444444");
    expect(card.serviceAreaKm).toBe(30);
  });

  it("allows horse owner with accepted farrier relationship to view non-public farrier", async () => {
    const horseOwner = await createUser("farrier-rel-horse-owner@example.com");
    const farrierOwner = await createUser("farrier-rel-owner@example.com");
    const farrier = await farrierService.createFarrier(String(farrierOwner._id), {
      displayName: "Relationship Farrier",
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
      relationshipType: "farrier",
      status: "accepted",
      requesterUserId: horseOwner._id,
      receiverUserId: farrierOwner._id,
      receiverAccountType: "farrier",
      receiverAccountId: farrier._id,
    });

    const card = await farrierService.getPublicFarrierCard(String(farrier._id), {
      isAuthenticated: true,
      id: String(horseOwner._id),
    });

    expect(card.id).toBe(String(farrier._id));
  });
});
