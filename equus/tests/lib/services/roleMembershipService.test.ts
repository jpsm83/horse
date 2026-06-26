import { describe, expect, it, vi } from "vitest";
import User from "@/models/User.ts";
import * as userService from "@/lib/services/userService.ts";
import * as roleMembershipService from "@/lib/services/roleMembershipService.ts";
import { canAccessRoleProfile } from "@/lib/auth/requireRoleProfileAccess.ts";
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

async function createWorker(email: string) {
  return userService.createCredentialsUser({
    email,
    password: "TestPass1!",
    firstName: "Worker",
  });
}

describe("roleMembershipService", () => {
  it("invites an existing user by email and allows accept", async () => {
    const owner = await createOwner("stable-owner@example.com");
    const worker = await createWorker("vet-worker@example.com");
    const stable = await createTestStable(owner._id);

    const invited = await roleMembershipService.inviteStaff(
      String(owner._id),
      "stable",
      String(stable._id),
      { email: "vet-worker@example.com", staffRole: "manager" },
    );

    expect(invited.status).toBe("invited");
    expect(invited.staffRole).toBe("manager");
    expect(invited.invitedEmail).toBe("vet-worker@example.com");

    const workplacesBefore = await roleMembershipService.listWorkplacesForUser(
      String(worker._id),
    );
    expect(workplacesBefore.some((w) => w.status === "invited")).toBe(true);

    const accepted = await roleMembershipService.acceptInvite(
      String(worker._id),
      invited.id,
    );
    expect(accepted.status).toBe("active");
    expect(accepted.acceptedAt).toBeDefined();

    const canView = await canAccessRoleProfile(
      String(worker._id),
      "stable",
      String(stable._id),
      "view_profile",
    );
    const canEdit = await canAccessRoleProfile(
      String(worker._id),
      "stable",
      String(stable._id),
      "edit_profile",
    );

    expect(canView).toBe(true);
    expect(canEdit).toBe(true);
  });

  it("allows an existing user to decline an invite", async () => {
    const owner = await createOwner("decline-owner@example.com");
    const worker = await createWorker("decline-worker@example.com");
    const stable = await createTestStable(owner._id);

    const invited = await roleMembershipService.inviteStaff(
      String(owner._id),
      "stable",
      String(stable._id),
      { email: "decline-worker@example.com", staffRole: "staff" },
    );

    const declined = await roleMembershipService.declineInvite(
      String(worker._id),
      invited.id,
    );

    expect(declined.status).toBe("declined");
  });

  it("links email-only invites on signup then accepts", async () => {
    const owner = await createOwner("signup-owner@example.com");
    const stable = await createTestStable(owner._id);

    const invited = await roleMembershipService.inviteStaff(
      String(owner._id),
      "stable",
      String(stable._id),
      { email: "new-worker@example.com", staffRole: "admin" },
    );

    expect(invited.user).toBeUndefined();

    const newWorker = await userService.createCredentialsUser({
      email: "new-worker@example.com",
      password: "TestPass1!",
    });

    const workplaces = await roleMembershipService.listWorkplacesForUser(
      String(newWorker._id),
    );
    expect(workplaces.some((w) => w.membershipId === invited.id && w.status === "invited")).toBe(
      true,
    );

    const accepted = await roleMembershipService.acceptInvite(
      String(newWorker._id),
      invited.id,
    );
    expect(accepted.status).toBe("active");

    const canEdit = await canAccessRoleProfile(
      String(newWorker._id),
      "stable",
      String(stable._id),
      "edit_profile",
    );
    expect(canEdit).toBe(true);
  });

  it("rejects duplicate invite for same email on a profile", async () => {
    const owner = await createOwner("dup-invite-owner@example.com");
    await createWorker("dup-invite-worker@example.com");
    const stable = await createTestStable(owner._id);

    await roleMembershipService.inviteStaff(
      String(owner._id),
      "stable",
      String(stable._id),
      { email: "dup-invite-worker@example.com", staffRole: "staff" },
    );

    await expect(
      roleMembershipService.inviteStaff(
        String(owner._id),
        "stable",
        String(stable._id),
        { email: "dup-invite-worker@example.com", staffRole: "admin" },
      ),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("lists staff and revokes membership for owner", async () => {
    const owner = await createOwner("list-owner@example.com");
    const worker = await createWorker("list-worker@example.com");
    const stable = await createTestStable(owner._id);

    const invited = await roleMembershipService.inviteStaff(
      String(owner._id),
      "stable",
      String(stable._id),
      { email: "list-worker@example.com", staffRole: "staff" },
    );

    const staff = await roleMembershipService.listStaff(
      String(owner._id),
      "stable",
      String(stable._id),
    );
    expect(staff).toHaveLength(1);

    const revoked = await roleMembershipService.revokeMembership(
      String(owner._id),
      "stable",
      String(stable._id),
      invited.id,
    );
    expect(revoked.status).toBe("removed");
  });

  it("includes owned stable in workplaces for owner", async () => {
    const owner = await createOwner("workplace-owner@example.com");
    const stable = await createTestStable(owner._id, { tradeName: "Sunrise Stable" });

    const workplaces = await roleMembershipService.listWorkplacesForUser(String(owner._id));

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

  it("does not add stableProfileIds to worker on accept", async () => {
    const owner = await createOwner("noids-owner@example.com");
    const worker = await createWorker("noids-worker@example.com");
    const stable = await createTestStable(owner._id);

    const invited = await roleMembershipService.inviteStaff(
      String(owner._id),
      "stable",
      String(stable._id),
      { email: "noids-worker@example.com", staffRole: "admin" },
    );

    await roleMembershipService.acceptInvite(String(worker._id), invited.id);

    const workerDoc = await User.findById(worker._id).lean();
    expect(workerDoc?.stableProfileIds).toBeUndefined();
  });
});
