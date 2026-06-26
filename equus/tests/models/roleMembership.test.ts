import { describe, expect, it } from "vitest";
import RoleMembership from "@/models/RoleMembership.ts";
import User from "@/models/User.ts";
import { createTestStable } from "@/tests/helpers/businessRoleFixtures.ts";

describe("RoleMembership model", () => {
  it("defaults status to invited", async () => {
    const owner = await User.create({
      personalDetails: { email: "owner@example.com", password: "hash" },
      authProvider: "credentials",
    });
    const stable = await createTestStable(owner._id);

    const membership = await RoleMembership.create({
      roleType: "stable",
      roleProfileId: stable._id,
      invitedEmail: "worker@example.com",
      staffRole: "staff",
      invitedByUserId: owner._id,
    });

    expect(membership.status).toBe("invited");
    expect(membership.invitedEmail).toBe("worker@example.com");
  });

  it("enforces invitedEmail on create", async () => {
    const owner = await User.create({
      personalDetails: { email: "dup-owner@example.com", password: "hash" },
      authProvider: "credentials",
    });
    const stable = await createTestStable(owner._id);

    await expect(
      RoleMembership.create({
        roleType: "stable",
        roleProfileId: stable._id,
        staffRole: "manager",
        status: "invited",
        invitedByUserId: owner._id,
      }),
    ).rejects.toThrow();
  });
});
