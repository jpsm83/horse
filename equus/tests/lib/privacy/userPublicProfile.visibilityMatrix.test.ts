/**
 * U-PRIV-01 visibility matrix — getPublicUserForRequester end-to-end (UA-08).
 *
 * Matrix (userModule.md):
 * | visibility     | anonymous | signed-in (no link) | relationship / collaboration |
 * | public         | yes       | yes                 | yes                          |
 * | platform       | no        | yes                 | yes                          |
 * | relationships| no        | no                  | yes                          |
 * | private        | no        | no                  | yes                          |
 */

import { describe, expect, it, vi } from "vitest";
import Horse from "@/models/Horse.ts";
import Relationship from "@/models/Relationship.ts";
import User from "@/models/User.ts";
import { ApiError } from "@/lib/api/errors.ts";
import {
  getPublicUserForRequester,
  type PublicUserProfileRequester,
} from "@/lib/privacy/userPublicProfile.ts";
import * as userService from "@/lib/services/userService.ts";
import * as workplaceRelationshipService from "@/lib/services/workplaceRelationshipService.ts";
import {
  createTestStable,
  createTestTrainer,
} from "@/tests/helpers/businessRoleFixtures.ts";

vi.mock("@/lib/email/sendStaffInviteEmail.ts", () => ({
  sendStaffInviteEmail: vi.fn().mockResolvedValue(undefined),
}));

type Visibility = "public" | "platform" | "relationships" | "private";

async function createTargetUser(
  email: string,
  profileVisibility: Visibility,
  name = { firstName: "Target", lastName: "User" },
) {
  const user = await userService.createCredentialsUser({
    email,
    password: "TestPass1!",
    ...name,
  });

  if (profileVisibility !== "public") {
    await userService.updatePersonalDetails(String(user._id), {
      preferences: { profileVisibility },
    });
  }

  return User.findById(user._id).lean();
}

async function createViewerUser(email: string) {
  return userService.createCredentialsUser({
    email,
    password: "TestPass1!",
    firstName: "Viewer",
    lastName: "User",
  });
}

function anonymousRequester(): PublicUserProfileRequester {
  return { isAuthenticated: false };
}

function signedInRequester(viewerId: string): PublicUserProfileRequester {
  return { id: viewerId, isAuthenticated: true };
}

async function linkUsersWithAcceptedRelationship(
  ownerId: string,
  viewerId: string,
): Promise<void> {
  const horse = await Horse.create({
    name: "Matrix Horse",
    breed: "TB",
    sex: "Gelding",
    mainOwnerUserId: ownerId,
    createdByUserId: ownerId,
  });
  const trainer = await createTestTrainer(viewerId);

  await Relationship.create({
    horseId: horse._id,
    relationshipType: "trainer",
    status: "accepted",
    requesterUserId: ownerId,
    receiverUserId: viewerId,
    receiverAccountType: "trainer",
    receiverAccountId: trainer._id,
  });
}

async function expectReadable(
  targetId: string,
  requester: PublicUserProfileRequester | undefined,
  expectedEmail: string,
) {
  const card = await getPublicUserForRequester(targetId, requester);
  expect(card.email).toBe(expectedEmail);
}

async function expectBlocked(targetId: string, requester?: PublicUserProfileRequester) {
  await expect(getPublicUserForRequester(targetId, requester)).rejects.toMatchObject({
    statusCode: 404,
    code: "NOT_FOUND",
  });
}

describe("user public profile visibility matrix", () => {
  describe("public visibility", () => {
    it("allows anonymous, signed-in, and relationship viewers", async () => {
      const target = await createTargetUser("matrix-public@example.com", "public");
      const viewer = await createViewerUser("matrix-public-viewer@example.com");
      const targetId = String(target!._id);
      const viewerId = String(viewer._id);

      await expectReadable(targetId, anonymousRequester(), "matrix-public@example.com");
      await expectReadable(
        targetId,
        signedInRequester(viewerId),
        "matrix-public@example.com",
      );

      await linkUsersWithAcceptedRelationship(targetId, viewerId);
      await expectReadable(
        targetId,
        signedInRequester(viewerId),
        "matrix-public@example.com",
      );
    });
  });

  describe("platform visibility", () => {
    it("blocks anonymous viewers", async () => {
      const target = await createTargetUser("matrix-platform-anon@example.com", "platform");
      await expectBlocked(String(target!._id), anonymousRequester());
    });

    it("allows signed-in viewers without a link", async () => {
      const target = await createTargetUser("matrix-platform-auth@example.com", "platform");
      const viewer = await createViewerUser("matrix-platform-viewer@example.com");

      await expectReadable(
        String(target!._id),
        signedInRequester(String(viewer._id)),
        "matrix-platform-auth@example.com",
      );
    });

    it("allows viewers with an accepted relationship", async () => {
      const target = await createTargetUser("matrix-platform-rel@example.com", "platform");
      const viewer = await createViewerUser("matrix-platform-rel-viewer@example.com");
      const targetId = String(target!._id);
      const viewerId = String(viewer._id);

      await linkUsersWithAcceptedRelationship(targetId, viewerId);
      await expectReadable(targetId, signedInRequester(viewerId), "matrix-platform-rel@example.com");
    });
  });

  describe("relationships visibility", () => {
    it("blocks anonymous and signed-in viewers without a link", async () => {
      const target = await createTargetUser(
        "matrix-relationships-blocked@example.com",
        "relationships",
      );
      const viewer = await createViewerUser("matrix-relationships-viewer@example.com");
      const targetId = String(target!._id);

      await expectBlocked(targetId, anonymousRequester());
      await expectBlocked(targetId, signedInRequester(String(viewer._id)));
    });

    it("allows viewers with an accepted relationship", async () => {
      const target = await createTargetUser(
        "matrix-relationships-allowed@example.com",
        "relationships",
      );
      const viewer = await createViewerUser("matrix-relationships-linked@example.com");
      const targetId = String(target!._id);
      const viewerId = String(viewer._id);

      await linkUsersWithAcceptedRelationship(targetId, viewerId);
      await expectReadable(
        targetId,
        signedInRequester(viewerId),
        "matrix-relationships-allowed@example.com",
      );
    });
  });

  describe("private visibility", () => {
    it("blocks anonymous and signed-in viewers without a link", async () => {
      const target = await createTargetUser("matrix-private-blocked@example.com", "private");
      const viewer = await createViewerUser("matrix-private-viewer@example.com");
      const targetId = String(target!._id);

      await expectBlocked(targetId, anonymousRequester());
      await expectBlocked(targetId, signedInRequester(String(viewer._id)));
    });

    it("allows viewers with an accepted relationship (operational context)", async () => {
      const target = await createTargetUser("matrix-private-rel@example.com", "private");
      const viewer = await createViewerUser("matrix-private-rel-viewer@example.com");
      const targetId = String(target!._id);
      const viewerId = String(viewer._id);

      await linkUsersWithAcceptedRelationship(targetId, viewerId);
      await expectReadable(targetId, signedInRequester(viewerId), "matrix-private-rel@example.com");
    });

    it("allows workplace collaborators without a horse relationship", async () => {
      const owner = await createTargetUser("matrix-private-collab-owner@example.com", "private", {
        firstName: "Stable",
        lastName: "Owner",
      });
      const collaborator = await createViewerUser("matrix-private-collab@example.com");
      const stable = await createTestStable(owner!._id);

      const invited = await workplaceRelationshipService.inviteCollaborator(
        String(owner!._id),
        "stable",
        String(stable._id),
        { email: "matrix-private-collab@example.com", hierarchyLevel: "staff" },
      );
      await workplaceRelationshipService.acceptInvite(String(collaborator._id), invited.id);

      await expectReadable(
        String(owner!._id),
        signedInRequester(String(collaborator._id)),
        "matrix-private-collab-owner@example.com",
      );
    });
  });

  it("returns NOT_FOUND for inactive targets across audiences", async () => {
    const target = await createTargetUser("matrix-inactive@example.com", "public");
    const viewer = await createViewerUser("matrix-inactive-viewer@example.com");
    const targetId = String(target!._id);

    await User.updateOne({ _id: targetId }, { $set: { isActive: false } });

    await expect(getPublicUserForRequester(targetId, anonymousRequester())).rejects.toBeInstanceOf(
      ApiError,
    );
    await expect(
      getPublicUserForRequester(targetId, signedInRequester(String(viewer._id))),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
