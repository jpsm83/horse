import { describe, expect, it } from "vitest";

import Relationship from "@/models/Relationship.ts";
import WorkplaceRelationship from "@/models/WorkplaceRelationship.ts";
import * as userService from "@/lib/services/userService.ts";
import * as horseService from "@/lib/services/horseService.ts";
import * as stableService from "@/lib/services/stableService.ts";

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
    firstName: "Stable",
  });
}

describe("stableService", () => {
  it("creates stable with main owner id and defaults", async () => {
    const owner = await createUser("stable-create-owner@example.com");

    const stable = await stableService.createStable(String(owner._id), {
      tradeName: "Sunrise Stable",
      description: "A friendly boarding stable",
      email: "sunrise@example.com",
      phoneNumber: "+351912345678",
      address: minimalAddress,
    });

    expect(String(stable.mainOwnerUserId)).toBe(String(owner._id));
    expect(stable.tradeName).toBe("Sunrise Stable");
    expect(stable.isPublic).toBe(true);
    expect(stable.acceptsNewHorses).toBe(true);
  });

  it("updates discovery settings only for owner/co-owner", async () => {
    const owner = await createUser("stable-discovery-owner@example.com");
    const outsider = await createUser("stable-outsider@example.com");
    const created = await stableService.createStable(String(owner._id), {
      tradeName: "Hidden Barn",
      description: "Private operations",
      email: "hidden@example.com",
      phoneNumber: "+351911111111",
      address: minimalAddress,
    });

    await expect(
      stableService.updateStableDiscovery(String(outsider._id), String(created._id), {
        isPublic: false,
      }),
    ).rejects.toMatchObject({ statusCode: 404 });

    const updated = await stableService.updateStableDiscovery(
      String(owner._id),
      String(created._id),
      {
        isPublic: false,
        acceptsNewHorses: false,
      },
    );

    expect(updated.isPublic).toBe(false);
    expect(updated.acceptsNewHorses).toBe(false);
  });

  it("returns public stable card with business contact for public stables", async () => {
    const owner = await createUser("stable-public-owner@example.com");
    const created = await stableService.createStable(String(owner._id), {
      tradeName: "Public Barn",
      description: "Open to everyone",
      email: "public@example.com",
      phoneNumber: "+351922222222",
      address: minimalAddress,
      isPublic: true,
    });

    const card = await stableService.getPublicStableCard(String(created._id), {
      isAuthenticated: false,
    });

    expect(card.tradeName).toBe("Public Barn");
    expect(card.contact.email).toBe("public@example.com");
    expect(card.contact.phone).toBe("+351922222222");
    expect(card.city).toBe("Lisbon");
    expect(card.country).toBe("Portugal");
  });

  it("hides non-public stable from anonymous users", async () => {
    const owner = await createUser("stable-private-owner@example.com");
    const created = await stableService.createStable(String(owner._id), {
      tradeName: "Private Barn",
      description: "Invite only",
      email: "private@example.com",
      phoneNumber: "+351933333333",
      address: minimalAddress,
      isPublic: false,
    });

    await expect(
      stableService.getPublicStableCard(String(created._id), { isAuthenticated: false }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("allows horse owner with accepted stable relationship to view non-public stable", async () => {
    const horseOwner = await createUser("stable-rel-horse-owner@example.com");
    const stableOwner = await createUser("stable-rel-stable-owner@example.com");
    const stable = await stableService.createStable(String(stableOwner._id), {
      tradeName: "Relationship Barn",
      description: "Hosts Comet",
      email: "rel@example.com",
      phoneNumber: "+351944444444",
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
      relationshipType: "stable",
      status: "accepted",
      requesterUserId: horseOwner._id,
      receiverUserId: stableOwner._id,
      receiverAccountType: "stable",
      receiverAccountId: stable._id,
    });

    const card = await stableService.getPublicStableCard(String(stable._id), {
      isAuthenticated: true,
      id: String(horseOwner._id),
    });

    expect(card.id).toBe(String(stable._id));
    expect(card.contact.email).toBe("rel@example.com");
  });

  it("allows active collaborator to view non-public stable", async () => {
    const stableOwner = await createUser("stable-collab-owner@example.com");
    const collaborator = await createUser("stable-collab-staff@example.com");
    const stable = await stableService.createStable(String(stableOwner._id), {
      tradeName: "Staff Barn",
      description: "Collaborator access",
      email: "staff@example.com",
      phoneNumber: "+351955555555",
      address: minimalAddress,
      isPublic: false,
    });

    await WorkplaceRelationship.create({
      hostRoleType: "stable",
      hostRoleProfileId: stable._id,
      userId: collaborator._id,
      invitedEmail: "stable-collab-staff@example.com",
      hierarchyLevel: "staff",
      status: "active",
      active: true,
      invitedByUserId: stableOwner._id,
      acceptedAt: new Date(),
    });

    const card = await stableService.getPublicStableCard(String(stable._id), {
      isAuthenticated: true,
      id: String(collaborator._id),
    });

    expect(card.id).toBe(String(stable._id));
  });

  it("denies unrelated signed-in user for non-public stable", async () => {
    const stableOwner = await createUser("stable-outsider-owner@example.com");
    const outsider = await createUser("stable-unrelated@example.com");
    const stable = await stableService.createStable(String(stableOwner._id), {
      tradeName: "Closed Barn",
      description: "No access",
      email: "closed@example.com",
      phoneNumber: "+351966666666",
      address: minimalAddress,
      isPublic: false,
    });

    await expect(
      stableService.getPublicStableCard(String(stable._id), {
        isAuthenticated: true,
        id: String(outsider._id),
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
