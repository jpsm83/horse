import { describe, expect, it } from "vitest";

import Relationship from "@/models/Relationship.ts";
import Transport from "@/models/Transport.ts";
import WorkplaceRelationship from "@/models/WorkplaceRelationship.ts";
import * as userService from "@/lib/services/userService.ts";
import * as horseService from "@/lib/services/horseService.ts";
import * as transportService from "@/lib/services/transportService.ts";

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
    firstName: "Transport",
  });
}

describe("transportService", () => {
  it("creates transport with main owner id and defaults", async () => {
    const owner = await createUser("transport-create-owner@example.com");

    const transport = await transportService.createTransport(String(owner._id), {
      companyName: "Equine Haulers",
      description: "Professional horse transport",
      email: "haul@example.com",
      phoneNumber: "+351912345678",
      address: minimalAddress,
    });

    expect(String(transport.mainOwnerUserId)).toBe(String(owner._id));
    expect(transport.companyName).toBe("Equine Haulers");
    expect(transport.isPublic).toBe(true);
    expect(transport.acceptsNewBookings).toBe(true);
  });

  it("allows same user to create multiple transport companies", async () => {
    const owner = await createUser("transport-multi@example.com");

    const first = await transportService.createTransport(String(owner._id), {
      companyName: "Haulers A",
      description: "First company",
      email: "a@example.com",
      phoneNumber: "+351911111111",
      address: minimalAddress,
    });

    const second = await transportService.createTransport(String(owner._id), {
      companyName: "Haulers B",
      description: "Second company",
      email: "b@example.com",
      phoneNumber: "+351922222222",
      address: minimalAddress,
    });

    expect(String(first._id)).not.toBe(String(second._id));
    expect(String(first.mainOwnerUserId)).toBe(String(second.mainOwnerUserId));
  });

  it("updates discovery settings only for owner/co-owner", async () => {
    const owner = await createUser("transport-discovery-owner@example.com");
    const coOwner = await createUser("transport-co-owner@example.com");
    const outsider = await createUser("transport-outsider@example.com");
    const created = await transportService.createTransport(String(owner._id), {
      companyName: "Private Haulers",
      description: "Invite only",
      email: "private@example.com",
      phoneNumber: "+351933333333",
      address: minimalAddress,
    });

    await Transport.findByIdAndUpdate(created._id, {
      $set: { coOwners: [{ userId: coOwner._id, ownershipPercentage: 40 }] },
    });

    await expect(
      transportService.updateTransportDiscovery(String(outsider._id), String(created._id), {
        isPublic: false,
      }),
    ).rejects.toMatchObject({ statusCode: 404 });

    const updatedByCoOwner = await transportService.updateTransportDiscovery(
      String(coOwner._id),
      String(created._id),
      {
        isPublic: false,
        acceptsNewBookings: false,
      },
    );

    expect(updatedByCoOwner.isPublic).toBe(false);
    expect(updatedByCoOwner.acceptsNewBookings).toBe(false);
  });

  it("returns public transport card with business contact", async () => {
    const owner = await createUser("transport-public@example.com");
    const created = await transportService.createTransport(String(owner._id), {
      companyName: "Public Haulers",
      description: "Open listing",
      email: "public@example.com",
      phoneNumber: "+351944444444",
      emergencyPhoneNumber: "+351955555555",
      address: minimalAddress,
    });

    const card = await transportService.getPublicTransportCard(String(created._id), {
      isAuthenticated: false,
    });

    expect(card.companyName).toBe("Public Haulers");
    expect(card.contact.email).toBe("public@example.com");
    expect(card.contact.emergencyPhone).toBe("+351955555555");
  });

  it("allows horse owner with accepted transport relationship to view non-public company", async () => {
    const horseOwner = await createUser("transport-rel-horse-owner@example.com");
    const transportOwner = await createUser("transport-rel-owner@example.com");
    const transport = await transportService.createTransport(String(transportOwner._id), {
      companyName: "Relationship Haulers",
      description: "Moves Comet",
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
      relationshipType: "transport",
      status: "accepted",
      requesterUserId: horseOwner._id,
      receiverUserId: transportOwner._id,
      receiverAccountType: "transport",
      receiverAccountId: transport._id,
    });

    const card = await transportService.getPublicTransportCard(String(transport._id), {
      isAuthenticated: true,
      id: String(horseOwner._id),
    });

    expect(card.id).toBe(String(transport._id));
  });

  it("allows active collaborator to view non-public transport company", async () => {
    const transportOwner = await createUser("transport-collab-owner@example.com");
    const collaborator = await createUser("transport-collab-staff@example.com");
    const transport = await transportService.createTransport(String(transportOwner._id), {
      companyName: "Staff Haulers",
      description: "Collaborator access",
      email: "staff@example.com",
      phoneNumber: "+351977777777",
      address: minimalAddress,
      isPublic: false,
    });

    await WorkplaceRelationship.create({
      hostRoleType: "transport",
      hostRoleProfileId: transport._id,
      userId: collaborator._id,
      invitedEmail: "transport-collab-staff@example.com",
      hierarchyLevel: "staff",
      status: "active",
      active: true,
      invitedByUserId: transportOwner._id,
      acceptedAt: new Date(),
    });

    const card = await transportService.getPublicTransportCard(String(transport._id), {
      isAuthenticated: true,
      id: String(collaborator._id),
    });

    expect(card.id).toBe(String(transport._id));
  });
});
