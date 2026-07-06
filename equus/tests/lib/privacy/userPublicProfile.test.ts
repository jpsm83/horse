/**
 * getPublicUserForRequester — visibility matrix and audience resolution (UA-05).
 */

import { describe, expect, it, vi } from "vitest";
import User from "@/models/User.ts";
import Horse from "@/models/Horse.ts";
import Relationship from "@/models/Relationship.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { getPublicUserForRequester } from "@/lib/privacy/userPublicProfile.ts";
import * as userService from "@/lib/services/userService.ts";
import * as workplaceRelationshipService from "@/lib/services/workplaceRelationshipService.ts";
import { createTestStable, createTestTrainer } from "@/tests/helpers/businessRoleFixtures.ts";

vi.mock("@/lib/email/sendStaffInviteEmail.ts", () => ({
  sendStaffInviteEmail: vi.fn().mockResolvedValue(undefined),
}));

async function createUser(
  email: string,
  overrides: {
    firstName?: string;
    lastName?: string;
    profileVisibility?: "public" | "platform" | "relationships" | "private";
    bio?: string;
    imageUrl?: string;
    username?: string;
  } = {},
) {
  const user = await userService.createCredentialsUser({
    email,
    password: "TestPass1!",
    firstName: overrides.firstName ?? "Profile",
    lastName: overrides.lastName ?? "User",
    username: overrides.username,
  });

  const patch: Record<string, unknown> = {};
  if (overrides.bio) patch.bio = overrides.bio;
  if (overrides.imageUrl) patch.imageUrl = overrides.imageUrl;
  if (overrides.profileVisibility) {
    patch.preferences = { profileVisibility: overrides.profileVisibility };
  }

  if (Object.keys(patch).length > 0) {
    await userService.updatePersonalDetails(String(user._id), patch);
  }

  return User.findById(user._id).lean();
}

describe("getPublicUserForRequester", () => {
  it("returns a public profile card for anonymous viewers when visibility is public", async () => {
    const target = await createUser("public-profile@example.com", {
      profileVisibility: "public",
      bio: "Horse enthusiast",
      imageUrl: "https://example.com/avatar.png",
      username: "publicuser",
    });

    const card = await getPublicUserForRequester(String(target!._id));

    expect(card).toMatchObject({
      id: String(target!._id),
      firstName: "Profile",
      lastName: "User",
      email: "public-profile@example.com",
      username: "publicuser",
      bio: "Horse enthusiast",
      imageUrl: "https://example.com/avatar.png",
    });
  });

  it("returns 404 for inactive users", async () => {
    const target = await createUser("inactive-profile@example.com");

    await User.updateOne({ _id: target!._id }, { $set: { isActive: false } });

    await expect(getPublicUserForRequester(String(target!._id))).rejects.toMatchObject({
      statusCode: 404,
      code: "NOT_FOUND",
    });
  });

  it("blocks platform-only profiles from anonymous viewers", async () => {
    const target = await createUser("platform-only@example.com", {
      profileVisibility: "platform",
    });

    await expect(getPublicUserForRequester(String(target!._id))).rejects.toBeInstanceOf(ApiError);
  });

  it("allows platform-only profiles for signed-in viewers without a link", async () => {
    const target = await createUser("platform-viewer@example.com", {
      profileVisibility: "platform",
    });
    const viewer = await createUser("signed-in-viewer@example.com");

    const card = await getPublicUserForRequester(String(target!._id), {
      id: String(viewer!._id),
      isAuthenticated: true,
    });

    expect(card.email).toBe("platform-viewer@example.com");
  });

  it("blocks relationships-only profiles until an accepted relationship exists", async () => {
    const owner = await createUser("horse-owner@example.com", {
      profileVisibility: "relationships",
    });
    const viewer = await createUser("no-link-viewer@example.com");

    await expect(
      getPublicUserForRequester(String(owner!._id), {
        id: String(viewer!._id),
        isAuthenticated: true,
      }),
    ).rejects.toMatchObject({ statusCode: 404 });

    const horse = await Horse.create({
      name: "Comet",
      breed: "TB",
      sex: "Gelding",
      mainOwnerUserId: owner!._id,
      createdByUserId: owner!._id,
    });
    const trainer = await createTestTrainer(viewer!._id);

    await Relationship.create({
      horseId: horse._id,
      relationshipType: "trainer",
      status: "accepted",
      requesterUserId: owner!._id,
      receiverUserId: viewer!._id,
      receiverAccountType: "trainer",
      receiverAccountId: trainer._id,
    });

    const card = await getPublicUserForRequester(String(owner!._id), {
      id: String(viewer!._id),
      isAuthenticated: true,
    });

    expect(card.email).toBe("horse-owner@example.com");
  });

  it("allows private profiles for workplace collaborators", async () => {
    const stableOwner = await createUser("stable-owner-profile@example.com", {
      profileVisibility: "private",
      firstName: "Stable",
      lastName: "Owner",
    });
    const collaborator = await createUser("stable-collab-profile@example.com");
    const stable = await createTestStable(stableOwner!._id);

    const invited = await workplaceRelationshipService.inviteCollaborator(
      String(stableOwner!._id),
      "stable",
      String(stable._id),
      { email: "stable-collab-profile@example.com", hierarchyLevel: "staff", title: "Staff", description: "Staff member" },
    );
    await workplaceRelationshipService.acceptInvite(String(collaborator!._id), invited.id);

    const card = await getPublicUserForRequester(String(stableOwner!._id), {
      id: String(collaborator!._id),
      isAuthenticated: true,
    });

    expect(card).toMatchObject({
      id: String(stableOwner!._id),
      firstName: "Stable",
      lastName: "Owner",
      email: "stable-owner-profile@example.com",
    });
  });
});
