import { describe, expect, it } from "vitest";

import Relationship from "@/models/Relationship.ts";
import Horse from "@/models/Horse.ts";
import User from "@/models/User.ts";
import WorkplaceRelationship from "@/models/WorkplaceRelationship.ts";
import * as userService from "@/lib/services/userService.ts";
import * as horseService from "@/lib/services/horseService.ts";
import { createTestStable } from "@/tests/helpers/businessRoleFixtures.ts";

async function createUser(email: string) {
  return userService.createCredentialsUser({
    email,
    password: "TestPass1!",
    firstName: "Horse",
  });
}

describe("horseService", () => {
  it("creates horse with main owner and creator ids", async () => {
    const owner = await createUser("horse-create-owner@example.com");

    const horse = await horseService.createHorse(String(owner._id), {
      name: "Comet",
      breed: "Lusitano",
      sex: "Gelding",
    });

    expect(String(horse.mainOwnerUserId)).toBe(String(owner._id));
    expect(String(horse.createdByUserId)).toBe(String(owner._id));
    expect(horse.profileVisibility).toBe("public");
    expect(String((horse.registration as { payerUserId?: unknown })?.payerUserId)).toBe(
      String(owner._id),
    );
    expect((horse.contactDisplay as { useOwnerContact?: boolean })?.useOwnerContact).toBe(true);
  });

  it("updates discovery settings only for owner/co-owner", async () => {
    const owner = await createUser("horse-discovery-owner@example.com");
    const outsider = await createUser("horse-outsider@example.com");
    const created = await horseService.createHorse(String(owner._id), {
      name: "Nova",
      breed: "Arabian",
      sex: "Mare",
    });

    await expect(
      horseService.updateHorseDiscovery(String(outsider._id), String(created._id), {
        profileVisibility: "owner_only",
      }),
    ).rejects.toMatchObject({ statusCode: 404 });

    const updated = await horseService.updateHorseDiscovery(
      String(owner._id),
      String(created._id),
      {
        profileVisibility: "relationship",
        contactDisplay: {
          useOwnerContact: false,
          name: "Barn Manager",
          phone: "+351911111111",
          email: "manager@example.com",
        },
      },
    );

    expect(updated.profileVisibility).toBe("relationship");
    expect((updated.contactDisplay as { useOwnerContact?: boolean }).useOwnerContact).toBe(false);
  });

  it("hides private owner contact on public horse card", async () => {
    const owner = await createUser("horse-private-owner@example.com");
    await User.updateOne(
      { _id: owner._id },
      { $set: { preferences: { profileVisibility: "private" } } },
    );

    const created = await horseService.createHorse(String(owner._id), {
      name: "Shadow",
      breed: "Dutch Warmblood",
      sex: "Stallion",
      profileVisibility: "public",
    });

    const card = await horseService.getPublicHorseCard(String(created._id), {
      isAuthenticated: true,
      id: undefined,
    });

    expect(card.contactDisplay.useOwnerContact).toBe(true);
    expect(card.contactDisplay.name).toBeUndefined();
    expect(card.contactDisplay.phone).toBeUndefined();
    expect(card.contactDisplay.email).toBeUndefined();
  });

  it("shows delegate contact even when owner is private", async () => {
    const owner = await createUser("horse-delegate-owner@example.com");
    await User.updateOne(
      { _id: owner._id },
      { $set: { preferences: { profileVisibility: "private" } } },
    );

    const created = await horseService.createHorse(String(owner._id), {
      name: "Atlas",
      breed: "Andalusian",
      sex: "Gelding",
      profileVisibility: "public",
      contactDisplay: {
        useOwnerContact: false,
        name: "Stable Contact",
        phone: "+351922222222",
        email: "stable-contact@example.com",
      },
    });

    const card = await horseService.getPublicHorseCard(String(created._id), {
      isAuthenticated: false,
    });

    expect(card.contactDisplay.useOwnerContact).toBe(false);
    expect(card.contactDisplay.name).toBe("Stable Contact");
    expect(card.contactDisplay.phone).toBe("+351922222222");
    expect(card.contactDisplay.email).toBe("stable-contact@example.com");
  });

  it("allows relationship visibility only for related users", async () => {
    const owner = await createUser("horse-rel-owner@example.com");
    const vetUser = await createUser("horse-rel-vet@example.com");
    const created = await horseService.createHorse(String(owner._id), {
      name: "Rex",
      breed: "American Quarter Horse",
      sex: "Gelding",
      profileVisibility: "relationship",
    });

    await expect(
      horseService.getPublicHorseCard(String(created._id), { isAuthenticated: true }),
    ).rejects.toMatchObject({ statusCode: 404 });

    await Relationship.create({
      horseId: created._id,
      relationshipType: "veterinary",
      status: "accepted",
      requesterUserId: owner._id,
      receiverUserId: vetUser._id,
      receiverAccountType: "veterinary",
    });

    const relatedCard = await horseService.getPublicHorseCard(String(created._id), {
      isAuthenticated: true,
      id: String(vetUser._id),
    });

    expect(relatedCard.id).toBe(String(created._id));
  });

  it("treats stable collaborators as related for relationship visibility", async () => {
    const owner = await createUser("horse-collab-owner@example.com");
    const stableOwner = await createUser("horse-collab-stable-owner@example.com");
    const collaborator = await createUser("horse-collab-staff@example.com");
    const stable = await createTestStable(stableOwner._id);

    const horse = await horseService.createHorse(String(owner._id), {
      name: "Bolt",
      breed: "Thoroughbred",
      sex: "Colt",
      profileVisibility: "relationship",
    });

    await Relationship.create({
      horseId: horse._id,
      relationshipType: "stable",
      status: "accepted",
      requesterUserId: owner._id,
      receiverUserId: stableOwner._id,
      receiverAccountType: "stable",
      receiverAccountId: stable._id,
    });

    await WorkplaceRelationship.create({
      hostRoleType: "stable",
      hostRoleProfileId: stable._id,
      userId: collaborator._id,
      invitedEmail: "horse-collab-staff@example.com",
      hierarchyLevel: "staff",
      status: "active",
      active: true,
      invitedByUserId: stableOwner._id,
      acceptedAt: new Date(),
    });

    const card = await horseService.getPublicHorseCard(String(horse._id), {
      isAuthenticated: true,
      id: String(collaborator._id),
    });
    expect(card.id).toBe(String(horse._id));
  });

  it("returns 404 for public card when horse is inactive", async () => {
    const owner = await createUser("horse-inactive@example.com");
    const created = await horseService.createHorse(String(owner._id), {
      name: "Retired",
      breed: "Dutch Warmblood",
      sex: "Mare",
      profileVisibility: "public",
    });

    await Horse.updateOne({ _id: created._id }, { $set: { isActive: false } });

    await expect(
      horseService.getPublicHorseCard(String(created._id), { isAuthenticated: false }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("returns 404 for public card when owner account is deactivated", async () => {
    const owner = await createUser("horse-deactivated-owner@example.com");
    const created = await horseService.createHorse(String(owner._id), {
      name: "Orphan Card",
      breed: "Dutch Warmblood",
      sex: "Gelding",
      profileVisibility: "public",
    });

    await userService.softDelete(String(owner._id));

    await expect(
      horseService.getPublicHorseCard(String(created._id), { isAuthenticated: false }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("returns owner hub summary with main-owner flag and co-owner labels", async () => {
    const main = await createUser("hub-summary-main@example.com");
    const partner = await createUser("hub-summary-partner@example.com");
    await User.updateOne(
      { _id: main._id },
      { $set: { "personalDetails.imageUrl": "https://example.com/main-avatar.png" } },
    );
    const created = await horseService.createHorse(String(main._id), {
      name: "Summary Horse",
      breed: "Lusitano",
      sex: "Gelding",
    });

    await Horse.updateOne(
      { _id: created._id },
      {
        $push: {
          coOwners: { userId: partner._id, ownershipPercentage: 25 },
        },
      },
    );

    const mainSummary = await horseService.getOwnerHorseHubSummary(
      String(main._id),
      String(created._id),
    );
    expect(mainSummary.isMainOwner).toBe(true);
    expect(mainSummary.coOwners).toHaveLength(1);
    expect(mainSummary.coOwners[0]?.userId).toBe(String(partner._id));

    const ownerEntry = mainSummary.adminTeam.find((member) => member.type === "owner");
    expect(ownerEntry).toMatchObject({
      userId: String(main._id),
      name: expect.any(String),
      email: "hub-summary-main@example.com",
      imageUrl: "https://example.com/main-avatar.png",
    });

    const partnerSummary = await horseService.getOwnerHorseHubSummary(
      String(partner._id),
      String(created._id),
    );
    expect(partnerSummary.isMainOwner).toBe(false);
    expect(partnerSummary.coOwners).toHaveLength(1);
  });
});

