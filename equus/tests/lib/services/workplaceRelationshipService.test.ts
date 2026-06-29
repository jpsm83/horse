import { describe, expect, it, vi } from "vitest";
import User from "@/models/User.ts";
import Stable from "@/models/Stable.ts";
import Horse from "@/models/Horse.ts";
import Relationship from "@/models/Relationship.ts";
import * as userService from "@/lib/services/userService.ts";
import * as workplaceRelationshipService from "@/lib/services/workplaceRelationshipService.ts";
import { canAccessRoleProfile } from "@/lib/auth/requireRoleProfileAccess.ts";
import { canCollaboratorActOnHorse } from "@/lib/horseAccess/canCollaboratorActOnHorse.ts";
import { createTestStable } from "@/tests/helpers/businessRoleFixtures.ts";

vi.mock("@/lib/email/sendStaffInviteEmail.ts", () => ({
  sendStaffInviteEmail: vi.fn().mockResolvedValue(undefined),
}));

async function createOwner(email: string) {
  return userService.createCredentialsUser({
    email,
    password: "TestPass1!",
    firstName: "Owner",
  });
}

async function createCollaborator(email: string) {
  return userService.createCredentialsUser({
    email,
    password: "TestPass1!",
    firstName: "Collaborator",
  });
}

function inviteInput(
  email: string,
  hierarchyLevel: "admin" | "manager" | "staff",
) {
  return { email, hierarchyLevel, title: undefined, description: undefined };
}

describe("workplaceRelationshipService", () => {
  it("invites an existing user by email and allows accept", async () => {
    const owner = await createOwner("stable-owner@example.com");
    const collaborator = await createCollaborator("vet-collaborator@example.com");
    const stable = await createTestStable(owner._id);

    const invited = await workplaceRelationshipService.inviteCollaborator(
      String(owner._id),
      "stable",
      String(stable._id),
      inviteInput("vet-collaborator@example.com", "manager"),
    );

    expect(invited.status).toBe("invited");
    expect(invited.hierarchyLevel).toBe("manager");
    expect(invited.invitedEmail).toBe("vet-collaborator@example.com");

    const workplacesBefore = await workplaceRelationshipService.listWorkplacesForUser(
      String(collaborator._id),
    );
    expect(workplacesBefore.some((w) => w.status === "invited")).toBe(true);

    const accepted = await workplaceRelationshipService.acceptInvite(
      String(collaborator._id),
      invited.id,
    );
    expect(accepted.status).toBe("active");
    expect(accepted.active).toBe(true);
    expect(accepted.acceptedAt).toBeDefined();

    const stableDoc = await Stable.findById(stable._id).lean();
    expect(stableDoc?.collaborators?.map(String)).toContain(accepted.id);

    const canView = await canAccessRoleProfile(
      String(collaborator._id),
      "stable",
      String(stable._id),
      "view_role_profile",
    );
    const canEdit = await canAccessRoleProfile(
      String(collaborator._id),
      "stable",
      String(stable._id),
      "edit_role_profile",
    );

    expect(canView).toBe(true);
    expect(canEdit).toBe(true);
  });

  it("allows an existing user to decline an invite", async () => {
    const owner = await createOwner("decline-owner@example.com");
    const collaborator = await createCollaborator("decline-collaborator@example.com");
    const stable = await createTestStable(owner._id);

    const invited = await workplaceRelationshipService.inviteCollaborator(
      String(owner._id),
      "stable",
      String(stable._id),
      inviteInput("decline-collaborator@example.com", "staff"),
    );

    const declined = await workplaceRelationshipService.declineInvite(
      String(collaborator._id),
      invited.id,
    );
    expect(declined.status).toBe("declined");
  });

  it("links invite by email when user signs up later", async () => {
    const owner = await createOwner("link-owner@example.com");
    const stable = await createTestStable(owner._id);

    const invited = await workplaceRelationshipService.inviteCollaborator(
      String(owner._id),
      "stable",
      String(stable._id),
      inviteInput("new-collaborator@example.com", "staff"),
    );

    const newUser = await userService.createCredentialsUser({
      email: "new-collaborator@example.com",
      password: "TestPass1!",
    });

    const workplaces = await workplaceRelationshipService.listWorkplacesForUser(
      String(newUser._id),
    );
    expect(workplaces.some((w) => w.membershipId === invited.id)).toBe(true);

    const accepted = await workplaceRelationshipService.acceptInvite(
      String(newUser._id),
      invited.id,
    );
    expect(accepted.status).toBe("active");
  });

  it("rejects duplicate invite for same email", async () => {
    const owner = await createOwner("dup-invite-owner@example.com");
    const stable = await createTestStable(owner._id);

    await workplaceRelationshipService.inviteCollaborator(
      String(owner._id),
      "stable",
      String(stable._id),
      inviteInput("dup-collaborator@example.com", "staff"),
    );

    await expect(
      workplaceRelationshipService.inviteCollaborator(
        String(owner._id),
        "stable",
        String(stable._id),
        inviteInput("dup-collaborator@example.com", "staff"),
      ),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("lists collaborators and ends collaboration", async () => {
    const owner = await createOwner("list-owner@example.com");
    const stable = await createTestStable(owner._id);

    const invited = await workplaceRelationshipService.inviteCollaborator(
      String(owner._id),
      "stable",
      String(stable._id),
      inviteInput("list-collaborator@example.com", "staff"),
    );

    const collaborators = await workplaceRelationshipService.listCollaborators(
      String(owner._id),
      "stable",
      String(stable._id),
    );
    expect(collaborators).toHaveLength(1);

    const ended = await workplaceRelationshipService.endCollaboration(
      String(owner._id),
      "stable",
      String(stable._id),
      invited.id,
    );
    expect(ended.status).toBe("ended");

    const stableDoc = await Stable.findById(stable._id).lean();
    expect(stableDoc?.collaborators ?? []).toHaveLength(0);
  });

  it("includes owned stable in workplaces for owner", async () => {
    const owner = await createOwner("workplace-owner@example.com");
    const stable = await createTestStable(owner._id, { tradeName: "Sunrise Stable" });

    const workplaces = await workplaceRelationshipService.listWorkplacesForUser(
      String(owner._id),
    );

    expect(workplaces).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          access: "owner",
          roleType: "stable",
          roleProfileId: String(stable._id),
          profileName: "Sunrise Stable",
        }),
      ]),
    );
  });

  it("does not add stableProfileIds to collaborator on accept", async () => {
    const owner = await createOwner("noids-owner@example.com");
    const collaborator = await createCollaborator("noids-collaborator@example.com");
    const stable = await createTestStable(owner._id);

    const invited = await workplaceRelationshipService.inviteCollaborator(
      String(owner._id),
      "stable",
      String(stable._id),
      inviteInput("noids-collaborator@example.com", "admin"),
    );

    await workplaceRelationshipService.acceptInvite(String(collaborator._id), invited.id);

    const collaboratorDoc = await User.findById(collaborator._id).lean();
    expect(collaboratorDoc?.stableProfileIds).toBeUndefined();
  });
});

describe("canCollaboratorActOnHorse (Option A)", () => {
  it("returns true when collaboration and stable hosting relationship exist", async () => {
    const owner = await createOwner("horse-owner@example.com");
    const stableOwner = await createOwner("stable-owner@example.com");
    const collaborator = await createCollaborator("groom@example.com");
    const stable = await createTestStable(stableOwner._id);

    const horse = await Horse.create({
      name: "Comet",
      breed: "TB",
      sex: "Gelding",
      mainOwnerUserId: owner._id,
      createdByUserId: owner._id,
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

    const invited = await workplaceRelationshipService.inviteCollaborator(
      String(stableOwner._id),
      "stable",
      String(stable._id),
      inviteInput("groom@example.com", "staff"),
    );
    await workplaceRelationshipService.acceptInvite(String(collaborator._id), invited.id);

    const allowed = await canCollaboratorActOnHorse(
      String(collaborator._id),
      String(horse._id),
      "stable",
      String(stable._id),
    );
    expect(allowed).toBe(true);
  });

  it("returns false without stable hosting relationship", async () => {
    const stableOwner = await createOwner("no-host-owner@example.com");
    const collaborator = await createCollaborator("groom2@example.com");
    const stable = await createTestStable(stableOwner._id);
    const owner = await createOwner("other-owner@example.com");

    const horse = await Horse.create({
      name: "Star",
      breed: "WB",
      sex: "Mare",
      mainOwnerUserId: owner._id,
      createdByUserId: owner._id,
    });

    const invited = await workplaceRelationshipService.inviteCollaborator(
      String(stableOwner._id),
      "stable",
      String(stable._id),
      inviteInput("groom2@example.com", "staff"),
    );
    await workplaceRelationshipService.acceptInvite(String(collaborator._id), invited.id);

    const allowed = await canCollaboratorActOnHorse(
      String(collaborator._id),
      String(horse._id),
      "stable",
      String(stable._id),
    );
    expect(allowed).toBe(false);
  });
});
