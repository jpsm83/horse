import { describe, expect, it } from "vitest";
import WorkplaceRelationship from "@/models/WorkplaceRelationship.ts";
import User from "@/models/User.ts";
import { createTestStable } from "@/tests/helpers/businessRoleFixtures.ts";

describe("WorkplaceRelationship model", () => {
  it("defaults status to invited and active to false", async () => {
    const owner = await User.create({
      personalDetails: { email: "owner@example.com", password: "hash" },
      authProvider: "credentials",
    });
    const stable = await createTestStable(owner._id);

    const collaboration = await WorkplaceRelationship.create({
      hostRoleType: "stable",
      hostRoleProfileId: stable._id,
      invitedEmail: "collaborator@example.com",
      hierarchyLevel: "staff",
      invitedByUserId: owner._id,
    });

    expect(collaboration.status).toBe("invited");
    expect(collaboration.active).toBe(false);
    expect(collaboration.invitedEmail).toBe("collaborator@example.com");
  });

  it("enforces invitedEmail on create", async () => {
    const owner = await User.create({
      personalDetails: { email: "dup-owner@example.com", password: "hash" },
      authProvider: "credentials",
    });
    const stable = await createTestStable(owner._id);

    await expect(
      WorkplaceRelationship.create({
        hostRoleType: "stable",
        hostRoleProfileId: stable._id,
        hierarchyLevel: "manager",
        status: "invited",
        invitedByUserId: owner._id,
      }),
    ).rejects.toThrow();
  });
});
