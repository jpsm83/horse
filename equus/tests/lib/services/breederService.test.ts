import { describe, expect, it } from "vitest";

import Breeder from "@/models/Breeder.ts";
import Relationship from "@/models/Relationship.ts";
import WorkplaceRelationship from "@/models/WorkplaceRelationship.ts";
import * as userService from "@/lib/services/userService.ts";
import * as horseService from "@/lib/services/horseService.ts";
import * as breederService from "@/lib/services/breederService.ts";

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
    firstName: "Breeder",
  });
}

describe("breederService", () => {
  it("creates breeder with main owner id and defaults", async () => {
    const owner = await createUser("breeder-create-owner@example.com");

    const breeder = await breederService.createBreeder(String(owner._id), {
      operationName: "Sunrise Stud",
      description: "Quality warmblood breeding",
      email: "stud@example.com",
      phoneNumber: "+351912345678",
      address: minimalAddress,
    });

    expect(String(breeder.mainOwnerUserId)).toBe(String(owner._id));
    expect(breeder.operationName).toBe("Sunrise Stud");
    expect(breeder.isPublic).toBe(true);
  });

  it("allows same user to create multiple breeder operations", async () => {
    const owner = await createUser("breeder-multi@example.com");

    const first = await breederService.createBreeder(String(owner._id), {
      operationName: "Stud A",
      description: "First operation",
      email: "a@example.com",
      phoneNumber: "+351911111111",
      address: minimalAddress,
    });

    const second = await breederService.createBreeder(String(owner._id), {
      operationName: "Stud B",
      description: "Second operation",
      email: "b@example.com",
      phoneNumber: "+351922222222",
      address: minimalAddress,
    });

    expect(String(first._id)).not.toBe(String(second._id));
    expect(String(first.mainOwnerUserId)).toBe(String(second.mainOwnerUserId));
  });

  it("updates discovery settings only for owner/co-owner", async () => {
    const owner = await createUser("breeder-discovery-owner@example.com");
    const outsider = await createUser("breeder-outsider@example.com");
    const created = await breederService.createBreeder(String(owner._id), {
      operationName: "Hidden Stud",
      description: "Private",
      email: "hidden@example.com",
      phoneNumber: "+351933333333",
      address: minimalAddress,
    });

    await expect(
      breederService.updateBreederDiscovery(String(outsider._id), String(created._id), {
        isPublic: false,
      }),
    ).rejects.toMatchObject({ statusCode: 404 });

    const updated = await breederService.updateBreederDiscovery(
      String(owner._id),
      String(created._id),
      { isPublic: false },
    );

    expect(updated.isPublic).toBe(false);
  });

  it("returns public breeder card with business contact", async () => {
    const owner = await createUser("breeder-public@example.com");
    const created = await breederService.createBreeder(String(owner._id), {
      operationName: "Public Stud",
      description: "Open listing",
      email: "public@example.com",
      phoneNumber: "+351944444444",
      address: minimalAddress,
    });

    const card = await breederService.getPublicBreederCard(String(created._id), {
      isAuthenticated: false,
    });

    expect(card.operationName).toBe("Public Stud");
    expect(card.contact.email).toBe("public@example.com");
  });

  it("allows horse owner with accepted breeder relationship to view non-public breeder", async () => {
    const horseOwner = await createUser("breeder-rel-horse-owner@example.com");
    const breederOwner = await createUser("breeder-rel-owner@example.com");
    const breeder = await breederService.createBreeder(String(breederOwner._id), {
      operationName: "Relationship Stud",
      description: "Bred Comet",
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
      relationshipType: "breeder",
      status: "accepted",
      requesterUserId: horseOwner._id,
      receiverUserId: breederOwner._id,
      receiverAccountType: "breeder",
      receiverAccountId: breeder._id,
    });

    const card = await breederService.getPublicBreederCard(String(breeder._id), {
      isAuthenticated: true,
      id: String(horseOwner._id),
    });

    expect(card.id).toBe(String(breeder._id));
  });

  it("allows active collaborator to view non-public breeder", async () => {
    const breederOwner = await createUser("breeder-collab-owner@example.com");
    const collaborator = await createUser("breeder-collab-staff@example.com");
    const breeder = await breederService.createBreeder(String(breederOwner._id), {
      operationName: "Staff Stud",
      description: "Collaborator access",
      email: "staff@example.com",
      phoneNumber: "+351966666666",
      address: minimalAddress,
      isPublic: false,
    });

    await WorkplaceRelationship.create({
      hostRoleType: "breeder",
      hostRoleProfileId: breeder._id,
      userId: collaborator._id,
      invitedEmail: "breeder-collab-staff@example.com",
      hierarchyLevel: "staff",
      status: "active",
      active: true,
      invitedByUserId: breederOwner._id,
      acceptedAt: new Date(),
    });

    const card = await breederService.getPublicBreederCard(String(breeder._id), {
      isAuthenticated: true,
      id: String(collaborator._id),
    });

    expect(card.id).toBe(String(breeder._id));
  });

  it("adds collaborator id to Breeder.collaborators on workplace accept", async () => {
    const owner = await createUser("breeder-index-owner@example.com");
    const staff = await createUser("breeder-index-staff@example.com");
    const breeder = await breederService.createBreeder(String(owner._id), {
      operationName: "Index Stud",
      description: "Collaborator index",
      email: "index@example.com",
      phoneNumber: "+351977777777",
      address: minimalAddress,
    });

    const collaboration = await WorkplaceRelationship.create({
      hostRoleType: "breeder",
      hostRoleProfileId: breeder._id,
      userId: staff._id,
      invitedEmail: "breeder-index-staff@example.com",
      hierarchyLevel: "staff",
      status: "active",
      active: true,
      invitedByUserId: owner._id,
      acceptedAt: new Date(),
    });

    await Breeder.findByIdAndUpdate(breeder._id, {
      $addToSet: { collaborators: collaboration._id },
    });

    const doc = await Breeder.findById(breeder._id).lean();
    expect(doc?.collaborators?.map(String)).toContain(String(collaboration._id));
  });
});
