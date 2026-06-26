import { describe, expect, it } from "vitest";
import User from "@/models/User.ts";
import Horse from "@/models/Horse.ts";
import Relationship from "@/models/Relationship.ts";
import * as userService from "@/lib/services/userService.ts";
import * as relationshipService from "@/lib/services/relationshipService.ts";
import { ApiError } from "@/lib/api/errors.ts";

async function createUser(email: string) {
  return userService.createCredentialsUser({
    email,
    password: "TestPass1!",
    firstName: "Test",
  });
}

async function createHorse(ownerId: string, name: string) {
  return Horse.create({
    name,
    breed: "Thoroughbred",
    sex: "Mare",
    mainOwnerUserId: ownerId,
    createdByUserId: ownerId,
  });
}

async function createPendingRelationship(input: {
  horseId: string;
  requesterUserId: string;
  invitedEmail: string;
  referralReference: string;
}) {
  return Relationship.create({
    horseId: input.horseId,
    relationshipType: "stable",
    status: "pending",
    requesterUserId: input.requesterUserId,
    receiverAccountType: "owner",
    invitedEmail: input.invitedEmail,
    referralReference: input.referralReference,
    historicalReference: {
      requesterLabel: "Oak Stable",
      horseNameSnapshot: "Star",
    },
  });
}

describe("relationshipService", () => {
  it("links relationship by referral on signup", async () => {
    const owner = await createUser("rel-owner@example.com");
    const horse = await createHorse(String(owner._id), "Star");
    const referralReference = "REF-LINK-001";

    await createPendingRelationship({
      horseId: String(horse._id),
      requesterUserId: String(owner._id),
      invitedEmail: "invitee@example.com",
      referralReference,
    });

    const invitee = await userService.createCredentialsUser({
      email: "invitee@example.com",
      password: "TestPass1!",
      referralReference,
    });

    const linked = await Relationship.findOne({ referralReference }).lean();
    expect(String(linked?.receiverUserId)).toBe(String(invitee._id));
  });

  it("lists pending relationships for invited email", async () => {
    const owner = await createUser("rel-owner2@example.com");
    const invitee = await createUser("pending-invitee@example.com");
    const horse = await createHorse(String(owner._id), "Comet");

    await createPendingRelationship({
      horseId: String(horse._id),
      requesterUserId: String(owner._id),
      invitedEmail: "pending-invitee@example.com",
      referralReference: "REF-LIST-001",
    });

    const pending = await relationshipService.listPendingForUser(
      String(invitee._id),
      "pending-invitee@example.com",
    );

    expect(pending).toHaveLength(1);
    expect(pending[0]?.horseName).toBe("Comet");
    expect(pending[0]?.status).toBe("pending");
  });

  it("accepts a pending relationship for the invitee", async () => {
    const owner = await createUser("rel-owner3@example.com");
    const invitee = await createUser("accept-invitee@example.com");
    const horse = await createHorse(String(owner._id), "Nova");

    const relationship = await createPendingRelationship({
      horseId: String(horse._id),
      requesterUserId: String(owner._id),
      invitedEmail: "accept-invitee@example.com",
      referralReference: "REF-ACCEPT-001",
    });

    await Relationship.updateOne(
      { _id: relationship._id },
      { $set: { receiverUserId: invitee._id } },
    );

    const accepted = await relationshipService.acceptRelationship(
      String(invitee._id),
      String(relationship._id),
    );

    expect(accepted.status).toBe("accepted");
  });

  it("declines a pending relationship for the invitee", async () => {
    const owner = await createUser("rel-owner4@example.com");
    const invitee = await createUser("decline-invitee@example.com");
    const horse = await createHorse(String(owner._id), "Bolt");

    const relationship = await createPendingRelationship({
      horseId: String(horse._id),
      requesterUserId: String(owner._id),
      invitedEmail: "decline-invitee@example.com",
      referralReference: "REF-DECLINE-001",
    });

    await Relationship.updateOne(
      { _id: relationship._id },
      { $set: { receiverUserId: invitee._id } },
    );

    const declined = await relationshipService.declineRelationship(
      String(invitee._id),
      String(relationship._id),
    );

    expect(declined.status).toBe("declined");
  });

  it("rejects accept from a non-invitee user", async () => {
    const owner = await createUser("rel-owner5@example.com");
    const invitee = await createUser("real-invitee@example.com");
    const stranger = await createUser("stranger@example.com");
    const horse = await createHorse(String(owner._id), "Flash");

    const relationship = await createPendingRelationship({
      horseId: String(horse._id),
      requesterUserId: String(owner._id),
      invitedEmail: "real-invitee@example.com",
      referralReference: "REF-FORBID-001",
    });

    await Relationship.updateOne(
      { _id: relationship._id },
      { $set: { receiverUserId: invitee._id } },
    );

    await expect(
      relationshipService.acceptRelationship(String(stranger._id), String(relationship._id)),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("returns invite preview by referral reference", async () => {
    const owner = await createUser("rel-owner6@example.com");
    const horse = await createHorse(String(owner._id), "Preview Horse");

    await createPendingRelationship({
      horseId: String(horse._id),
      requesterUserId: String(owner._id),
      invitedEmail: "preview@example.com",
      referralReference: "REF-PREVIEW-001",
    });

    const preview = await relationshipService.getInvitePreviewByReferral("REF-PREVIEW-001");
    expect(preview?.horseName).toBe("Preview Horse");
    expect(preview?.requesterLabel).toBe("Oak Stable");
  });
});
