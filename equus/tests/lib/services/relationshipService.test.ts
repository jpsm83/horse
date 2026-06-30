import { describe, expect, it, vi } from "vitest";
import User from "@/models/User.ts";
import Horse from "@/models/Horse.ts";
import Relationship from "@/models/Relationship.ts";
import * as userService from "@/lib/services/userService.ts";
import * as relationshipService from "@/lib/services/relationshipService.ts";
import { ApiError } from "@/lib/api/errors.ts";
import {
  createTestGroom,
  createTestStable,
  createTestVeterinary,
} from "../../helpers/businessRoleFixtures.ts";

vi.mock("@/lib/email/sendRelationshipInviteEmail.ts", () => ({
  sendRelationshipInviteEmail: vi.fn().mockResolvedValue(undefined),
}));

async function createUser(email: string, firstName = "Test") {
  return userService.createCredentialsUser({
    email,
    password: "TestPass1!",
    firstName,
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
    receiverAccountType: "stable",
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

  it("creates invite by provider profile id", async () => {
    const owner = await createUser("rel-create-owner@example.com", "Alice");
    const vetUser = await createUser("rel-create-vet@example.com");
    const horse = await createHorse(String(owner._id), "Comet");
    const veterinary = await createTestVeterinary(String(vetUser._id));

    const created = await relationshipService.createRelationshipInvite(String(owner._id), {
      horseId: String(horse._id),
      relationshipType: "veterinary",
      receiverAccountId: String(veterinary._id),
    });

    expect(created.status).toBe("pending");
    expect(created.relationshipType).toBe("veterinary");
    expect(created.horseName).toBe("Comet");

    const stored = await Relationship.findById(created.id).lean();
    expect(stored?.status).toBe("pending");
    expect(String(stored?.receiverAccountId)).toBe(String(veterinary._id));
    expect(String(stored?.receiverUserId)).toBe(String(vetUser._id));
    expect(stored?.referralReference).toMatch(/^REF-/);
  });

  it("creates invite by email for user-linked provider", async () => {
    const owner = await createUser("rel-create-owner2@example.com");
    const horse = await createHorse(String(owner._id), "Star");

    const created = await relationshipService.createRelationshipInvite(String(owner._id), {
      horseId: String(horse._id),
      relationshipType: "groom",
      invitedEmail: "new-groom@example.com",
      invitedName: "Sam Groom",
    });

    expect(created.status).toBe("pending");
    expect(created.invitedEmail).toBe("new-groom@example.com");
    expect(created.referralReference).toMatch(/^REF-/);

    const stored = await Relationship.findById(created.id).lean();
    expect(stored?.receiverAccountId).toBeUndefined();
    expect(stored?.invitedEmail).toBe("new-groom@example.com");
  });

  it("rejects create invite from non-owner", async () => {
    const owner = await createUser("rel-forbid-owner@example.com");
    const stranger = await createUser("rel-forbid-stranger@example.com");
    const stableOwner = await createUser("rel-forbid-stable@example.com");
    const horse = await createHorse(String(owner._id), "Bolt");
    const stable = await createTestStable(String(stableOwner._id));

    await expect(
      relationshipService.createRelationshipInvite(String(stranger._id), {
        horseId: String(horse._id),
        relationshipType: "stable",
        receiverAccountId: String(stable._id),
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("rejects duplicate pending invite", async () => {
    const owner = await createUser("rel-dup-owner@example.com");
    const stableOwner = await createUser("rel-dup-stable@example.com");
    const horse = await createHorse(String(owner._id), "Nova");
    const stable = await createTestStable(String(stableOwner._id));

    const input = {
      horseId: String(horse._id),
      relationshipType: "stable" as const,
      receiverAccountId: String(stable._id),
    };

    await relationshipService.createRelationshipInvite(String(owner._id), input);

    await expect(
      relationshipService.createRelationshipInvite(String(owner._id), input),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("allows re-invite after decline", async () => {
    const owner = await createUser("rel-resend-owner@example.com");
    const groomUser = await createUser("rel-resend-groom@example.com");
    const horse = await createHorse(String(owner._id), "Dawn");

    await relationshipService.createRelationshipInvite(String(owner._id), {
      horseId: String(horse._id),
      relationshipType: "groom",
      invitedEmail: "rel-resend-groom@example.com",
    });

    const pending = await Relationship.findOne({
      horseId: horse._id,
      status: "pending",
    });
    expect(pending).toBeTruthy();

    await Relationship.updateOne(
      { _id: pending!._id },
      {
        $set: {
          status: "declined",
          receiverUserId: groomUser._id,
          respondedAt: new Date(),
        },
      },
    );

    const resent = await relationshipService.createRelationshipInvite(String(owner._id), {
      horseId: String(horse._id),
      relationshipType: "groom",
      invitedEmail: "rel-resend-groom@example.com",
    });

    expect(resent.status).toBe("pending");
    expect(
      await Relationship.countDocuments({ horseId: horse._id, status: "pending" }),
    ).toBe(1);
  });

  it("backfills receiverAccountId from user profile on accept", async () => {
    const owner = await createUser("rel-backfill-owner@example.com");
    const groomUser = await createUser("rel-backfill-groom@example.com");
    const groom = await createTestGroom(String(groomUser._id), {
      email: "rel-backfill-groom@example.com",
    });
    const horse = await createHorse(String(owner._id), "Mist");

    const created = await relationshipService.createRelationshipInvite(String(owner._id), {
      horseId: String(horse._id),
      relationshipType: "groom",
      invitedEmail: "rel-backfill-groom@example.com",
    });

    const accepted = await relationshipService.acceptRelationship(
      String(groomUser._id),
      created.id,
    );

    expect(accepted.status).toBe("accepted");

    const stored = await Relationship.findById(created.id).lean();
    expect(String(stored?.receiverAccountId)).toBe(String(groom._id));
    expect(String(stored?.receiverUserId)).toBe(String(groomUser._id));
  });

  it("lists pending sent relationships for horse owner", async () => {
    const owner = await createUser("rel-sent-owner@example.com");
    const stranger = await createUser("rel-sent-stranger@example.com");
    const horse = await createHorse(String(owner._id), "Sent Horse");

    await createPendingRelationship({
      horseId: String(horse._id),
      requesterUserId: String(owner._id),
      invitedEmail: "sent-vet@example.com",
      referralReference: "REF-SENT-001",
    });

    await Relationship.create({
      horseId: horse._id,
      relationshipType: "groom",
      status: "pending",
      requesterUserId: owner._id,
      receiverAccountType: "groom",
      invitedEmail: "sent-groom@example.com",
      referralReference: "REF-SENT-002",
      historicalReference: { requesterLabel: "Owner", horseNameSnapshot: "Sent Horse" },
    });

    const sent = await relationshipService.listPendingSentForHorse(
      String(owner._id),
      String(horse._id),
    );

    expect(sent).toHaveLength(2);
    expect(sent.every((r) => r.status === "pending")).toBe(true);
    expect(sent[0]?.horseName).toBe("Sent Horse");

    await expect(
      relationshipService.listPendingSentForHorse(String(stranger._id), String(horse._id)),
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});
