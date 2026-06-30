import { describe, expect, it } from "vitest";

import User from "@/models/User.ts";
import Relationship from "@/models/Relationship.ts";
import * as userService from "@/lib/services/userService.ts";
import * as horseService from "@/lib/services/horseService.ts";
import * as veterinaryService from "@/lib/services/veterinaryService.ts";

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
    firstName: "Vet",
  });
}

describe("veterinaryService", () => {
  it("creates veterinary with userId and sets veterinaryProfileId on User", async () => {
    const owner = await createUser("vet-create-owner@example.com");

    const veterinary = await veterinaryService.createVeterinary(String(owner._id), {
      practiceName: "Equine Care Lisbon",
      description: "Full-service equine veterinary practice",
      email: "care@example.com",
      phoneNumber: "+351912345678",
      address: minimalAddress,
    });

    expect(String(veterinary.userId)).toBe(String(owner._id));
    expect(veterinary.practiceName).toBe("Equine Care Lisbon");
    expect(veterinary.isPublic).toBe(true);
    expect(veterinary.acceptsNewPatients).toBe(true);

    const user = await User.findById(owner._id).lean();
    expect(String(user?.veterinaryProfileId)).toBe(String(veterinary._id));
  });

  it("rejects second veterinary create for the same user", async () => {
    const owner = await createUser("vet-duplicate@example.com");

    await veterinaryService.createVeterinary(String(owner._id), {
      practiceName: "First Practice",
      description: "First profile",
      email: "first@example.com",
      phoneNumber: "+351911111111",
      address: minimalAddress,
    });

    await expect(
      veterinaryService.createVeterinary(String(owner._id), {
        practiceName: "Second Practice",
        description: "Should fail",
        email: "second@example.com",
        phoneNumber: "+351922222222",
        address: minimalAddress,
      }),
    ).rejects.toMatchObject({ statusCode: 409, code: "CONFLICT" });
  });

  it("updates discovery settings only for profile owner", async () => {
    const owner = await createUser("vet-discovery-owner@example.com");
    const outsider = await createUser("vet-outsider@example.com");
    const created = await veterinaryService.createVeterinary(String(owner._id), {
      practiceName: "Private Practice",
      description: "Invite only",
      email: "private@example.com",
      phoneNumber: "+351933333333",
      address: minimalAddress,
    });

    await expect(
      veterinaryService.updateVeterinaryDiscovery(String(outsider._id), String(created._id), {
        isPublic: false,
      }),
    ).rejects.toMatchObject({ statusCode: 404 });

    const updated = await veterinaryService.updateVeterinaryDiscovery(
      String(owner._id),
      String(created._id),
      {
        isPublic: false,
        acceptsNewPatients: false,
      },
    );

    expect(updated.isPublic).toBe(false);
    expect(updated.acceptsNewPatients).toBe(false);
  });

  it("returns public veterinary card with business contact", async () => {
    const owner = await createUser("vet-public@example.com");
    const created = await veterinaryService.createVeterinary(String(owner._id), {
      practiceName: "Public Vet Clinic",
      description: "Open listing",
      email: "public@example.com",
      phoneNumber: "+351944444444",
      emergencyPhoneNumber: "+351955555555",
      address: minimalAddress,
      equineSpecializations: [{ name: "Lameness" }],
      emergencyAvailability: true,
      serviceAreaKm: 50,
    });

    const card = await veterinaryService.getPublicVeterinaryCard(String(created._id), {
      isAuthenticated: false,
    });

    expect(card.practiceName).toBe("Public Vet Clinic");
    expect(card.contact.email).toBe("public@example.com");
    expect(card.contact.phone).toBe("+351944444444");
    expect(card.contact.emergencyPhone).toBe("+351955555555");
    expect(card.equineSpecializations).toEqual([{ name: "Lameness" }]);
    expect(card.emergencyAvailability).toBe(true);
    expect(card.serviceAreaKm).toBe(50);
  });

  it("allows horse owner with accepted veterinary relationship to view non-public veterinary", async () => {
    const horseOwner = await createUser("vet-rel-horse-owner@example.com");
    const vetOwner = await createUser("vet-rel-owner@example.com");
    const veterinary = await veterinaryService.createVeterinary(String(vetOwner._id), {
      practiceName: "Relationship Vet",
      description: "Treats Comet",
      email: "rel@example.com",
      phoneNumber: "+351966666666",
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
      relationshipType: "veterinary",
      status: "accepted",
      requesterUserId: horseOwner._id,
      receiverUserId: vetOwner._id,
      receiverAccountType: "veterinary",
      receiverAccountId: veterinary._id,
    });

    const card = await veterinaryService.getPublicVeterinaryCard(String(veterinary._id), {
      isAuthenticated: true,
      id: String(horseOwner._id),
    });

    expect(card.id).toBe(String(veterinary._id));
  });

  it("omits optional fields when not provided on create", async () => {
    const owner = await createUser("vet-minimal@example.com");

    const veterinary = await veterinaryService.createVeterinary(String(owner._id), {
      practiceName: "Minimal Vet",
      description: "Required fields only",
      email: "minimal@example.com",
      phoneNumber: "+351977777777",
      address: minimalAddress,
    });

    expect(veterinary.equineSpecializations).toBeUndefined();
    expect(veterinary.certifications).toBeUndefined();
    expect(veterinary.licenseNumber).toBeUndefined();
    expect(veterinary.emergencyAvailability).toBe(false);
    expect(veterinary.serviceAreaKm).toBeUndefined();
  });
});
