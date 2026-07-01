import { describe, expect, it } from "vitest";

import Relationship from "@/models/Relationship.ts";
import RidingClub from "@/models/RidingClub.ts";
import WorkplaceRelationship from "@/models/WorkplaceRelationship.ts";
import * as userService from "@/lib/services/userService.ts";
import * as horseService from "@/lib/services/horseService.ts";
import * as ridingClubService from "@/lib/services/ridingClubService.ts";

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
    firstName: "RidingClub",
  });
}

describe("ridingClubService", () => {
  it("creates riding club with main owner id and defaults", async () => {
    const owner = await createUser("riding-club-create-owner@example.com");

    const ridingClub = await ridingClubService.createRidingClub(String(owner._id), {
      clubName: "Lisbon Equestrian Club",
      description: "A friendly riding club",
      email: "club@example.com",
      phoneNumber: "+351912345678",
      address: minimalAddress,
    });

    expect(String(ridingClub.mainOwnerUserId)).toBe(String(owner._id));
    expect(ridingClub.clubName).toBe("Lisbon Equestrian Club");
    expect(ridingClub.isPublic).toBe(true);
    expect(ridingClub.acceptsNewMembers).toBe(true);
  });

  it("allows same user to create multiple riding clubs", async () => {
    const owner = await createUser("riding-club-multi@example.com");

    const first = await ridingClubService.createRidingClub(String(owner._id), {
      clubName: "Club A",
      description: "First club",
      email: "a@example.com",
      phoneNumber: "+351911111111",
      address: minimalAddress,
    });

    const second = await ridingClubService.createRidingClub(String(owner._id), {
      clubName: "Club B",
      description: "Second club",
      email: "b@example.com",
      phoneNumber: "+351922222222",
      address: minimalAddress,
    });

    expect(String(first._id)).not.toBe(String(second._id));
    expect(String(first.mainOwnerUserId)).toBe(String(second.mainOwnerUserId));
  });

  it("updates discovery settings only for owner/co-owner", async () => {
    const owner = await createUser("riding-club-discovery-owner@example.com");
    const coOwner = await createUser("riding-club-co-owner@example.com");
    const outsider = await createUser("riding-club-outsider@example.com");
    const created = await ridingClubService.createRidingClub(String(owner._id), {
      clubName: "Private Club",
      description: "Invite only",
      email: "private@example.com",
      phoneNumber: "+351933333333",
      address: minimalAddress,
    });

    await RidingClub.findByIdAndUpdate(created._id, {
      $set: { coOwners: [{ userId: coOwner._id, ownershipPercentage: 40 }] },
    });

    await expect(
      ridingClubService.updateRidingClubDiscovery(String(outsider._id), String(created._id), {
        isPublic: false,
      }),
    ).rejects.toMatchObject({ statusCode: 404 });

    const updatedByCoOwner = await ridingClubService.updateRidingClubDiscovery(
      String(coOwner._id),
      String(created._id),
      {
        isPublic: false,
        acceptsNewMembers: false,
      },
    );

    expect(updatedByCoOwner.isPublic).toBe(false);
    expect(updatedByCoOwner.acceptsNewMembers).toBe(false);
  });

  it("returns public riding club card with business contact", async () => {
    const owner = await createUser("riding-club-public@example.com");
    const created = await ridingClubService.createRidingClub(String(owner._id), {
      clubName: "Public Club",
      description: "Open listing",
      email: "public@example.com",
      phoneNumber: "+351944444444",
      address: minimalAddress,
      disciplines: ["Dressage"],
      membershipInfo: "Annual membership available",
      membershipFee: 120,
    });

    const card = await ridingClubService.getPublicRidingClubCard(String(created._id), {
      isAuthenticated: false,
    });

    expect(card.clubName).toBe("Public Club");
    expect(card.contact.email).toBe("public@example.com");
    expect(card.disciplines).toEqual(["Dressage"]);
    expect(card.membershipFee).toBe(120);
  });

  it("allows horse owner with accepted riding club relationship to view non-public club", async () => {
    const horseOwner = await createUser("riding-club-rel-horse-owner@example.com");
    const clubOwner = await createUser("riding-club-rel-owner@example.com");
    const ridingClub = await ridingClubService.createRidingClub(String(clubOwner._id), {
      clubName: "Relationship Club",
      description: "Hosts Comet",
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
      relationshipType: "ridingClub",
      status: "accepted",
      requesterUserId: horseOwner._id,
      receiverUserId: clubOwner._id,
      receiverAccountType: "ridingClub",
      receiverAccountId: ridingClub._id,
    });

    const card = await ridingClubService.getPublicRidingClubCard(String(ridingClub._id), {
      isAuthenticated: true,
      id: String(horseOwner._id),
    });

    expect(card.id).toBe(String(ridingClub._id));
  });

  it("allows active collaborator to view non-public riding club", async () => {
    const clubOwner = await createUser("riding-club-collab-owner@example.com");
    const collaborator = await createUser("riding-club-collab-staff@example.com");
    const ridingClub = await ridingClubService.createRidingClub(String(clubOwner._id), {
      clubName: "Staff Club",
      description: "Collaborator access",
      email: "staff@example.com",
      phoneNumber: "+351977777777",
      address: minimalAddress,
      isPublic: false,
    });

    await WorkplaceRelationship.create({
      hostRoleType: "ridingClub",
      hostRoleProfileId: ridingClub._id,
      userId: collaborator._id,
      invitedEmail: "riding-club-collab-staff@example.com",
      hierarchyLevel: "staff",
      status: "active",
      active: true,
      invitedByUserId: clubOwner._id,
      acceptedAt: new Date(),
    });

    const card = await ridingClubService.getPublicRidingClubCard(String(ridingClub._id), {
      isAuthenticated: true,
      id: String(collaborator._id),
    });

    expect(card.clubName).toBe("Staff Club");
  });
});
