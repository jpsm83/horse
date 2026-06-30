import { describe, expect, it } from "vitest";

import User from "@/models/User.ts";
import Relationship from "@/models/Relationship.ts";
import * as userService from "@/lib/services/userService.ts";
import * as horseService from "@/lib/services/horseService.ts";
import * as coachService from "@/lib/services/coachService.ts";

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
    firstName: "Coach",
  });
}

describe("coachService", () => {
  it("creates coach with userId and sets coachProfileId on User", async () => {
    const owner = await createUser("coach-create-owner@example.com");

    const coach = await coachService.createCoach(String(owner._id), {
      displayName: "Alex Coach",
      bio: "Competition preparation specialist",
      email: "alex@example.com",
      phoneNumber: "+351912345678",
      address: minimalAddress,
    });

    expect(String(coach.userId)).toBe(String(owner._id));
    expect(coach.displayName).toBe("Alex Coach");
    expect(coach.isPublic).toBe(true);
    expect(coach.acceptsNewClients).toBe(true);

    const user = await User.findById(owner._id).lean();
    expect(String(user?.coachProfileId)).toBe(String(coach._id));
  });

  it("rejects second coach create for the same user", async () => {
    const owner = await createUser("coach-duplicate@example.com");

    await coachService.createCoach(String(owner._id), {
      displayName: "First Coach",
      bio: "First profile",
      email: "first@example.com",
      phoneNumber: "+351911111111",
      address: minimalAddress,
    });

    await expect(
      coachService.createCoach(String(owner._id), {
        displayName: "Second Coach",
        bio: "Should fail",
        email: "second@example.com",
        phoneNumber: "+351922222222",
        address: minimalAddress,
      }),
    ).rejects.toMatchObject({ statusCode: 409, code: "CONFLICT" });
  });

  it("updates discovery settings only for profile owner", async () => {
    const owner = await createUser("coach-discovery-owner@example.com");
    const outsider = await createUser("coach-outsider@example.com");
    const created = await coachService.createCoach(String(owner._id), {
      displayName: "Private Coach",
      bio: "Invite only",
      email: "private@example.com",
      phoneNumber: "+351933333333",
      address: minimalAddress,
    });

    await expect(
      coachService.updateCoachDiscovery(String(outsider._id), String(created._id), {
        isPublic: false,
      }),
    ).rejects.toMatchObject({ statusCode: 404 });

    const updated = await coachService.updateCoachDiscovery(
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

  it("returns public coach card with business contact", async () => {
    const owner = await createUser("coach-public@example.com");
    const created = await coachService.createCoach(String(owner._id), {
      displayName: "Public Coach",
      bio: "Open listing",
      email: "public@example.com",
      phoneNumber: "+351944444444",
      address: minimalAddress,
      disciplines: ["Dressage"],
      competitionLevels: ["national"],
    });

    const card = await coachService.getPublicCoachCard(String(created._id), {
      isAuthenticated: false,
    });

    expect(card.displayName).toBe("Public Coach");
    expect(card.contact.email).toBe("public@example.com");
    expect(card.contact.phone).toBe("+351944444444");
    expect(card.disciplines).toEqual(["Dressage"]);
    expect(card.competitionLevels).toEqual(["national"]);
  });

  it("allows horse owner with accepted coach relationship to view non-public coach", async () => {
    const horseOwner = await createUser("coach-rel-horse-owner@example.com");
    const coachOwner = await createUser("coach-rel-owner@example.com");
    const coach = await coachService.createCoach(String(coachOwner._id), {
      displayName: "Relationship Coach",
      bio: "Coaches Comet",
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
      relationshipType: "coach",
      status: "accepted",
      requesterUserId: horseOwner._id,
      receiverUserId: coachOwner._id,
      receiverAccountType: "coach",
      receiverAccountId: coach._id,
    });

    const card = await coachService.getPublicCoachCard(String(coach._id), {
      isAuthenticated: true,
      id: String(horseOwner._id),
    });

    expect(card.id).toBe(String(coach._id));
  });

  it("omits optional fields when not provided on create", async () => {
    const owner = await createUser("coach-minimal@example.com");

    const coach = await coachService.createCoach(String(owner._id), {
      displayName: "Minimal Coach",
      bio: "Required fields only",
      email: "minimal@example.com",
      phoneNumber: "+351966666666",
      address: minimalAddress,
    });

    expect(coach.disciplines).toBeUndefined();
    expect(coach.competitionLevels).toBeUndefined();
    expect(coach.preparationServices).toBeUndefined();
    expect(coach.experienceYears).toBeUndefined();
  });
});
