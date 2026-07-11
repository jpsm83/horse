import { describe, expect, it, vi } from "vitest";
import User from "@/models/User.ts";
import Horse from "@/models/Horse.ts";
import Relationship from "@/models/Relationship.ts";
import * as userService from "@/lib/services/userService.ts";
import * as relationshipService from "@/lib/services/relationshipService.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { createRelationshipSchema } from "@/lib/validations/relationship.ts";
import {
  createTestBreeder,
  createTestCoach,
  createTestFarrier,
  createTestGroom,
  createTestRider,
  createTestRidingClub,
  createTestStable,
  createTestTrainer,
  createTestTransport,
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

  it("creates invite by profile id for user-linked types (trainer, farrier, rider, coach)", async () => {
    const owner = await createUser("rel-profile-user-owner@example.com", "Alice");
    const horse = await createHorse(String(owner._id), "Blaze");

    const userLinkedTypes = [
      { type: "trainer" as const, createFixture: createTestTrainer },
      { type: "farrier" as const, createFixture: createTestFarrier },
      { type: "rider" as const, createFixture: createTestRider },
      { type: "coach" as const, createFixture: createTestCoach },
    ];

    for (const { type, createFixture } of userLinkedTypes) {
      const providerUser = await createUser(`rel-${type}-profile@example.com`);
      const providerProfile = await createFixture(String(providerUser._id));

      const created = await relationshipService.createRelationshipInvite(String(owner._id), {
        horseId: String(horse._id),
        relationshipType: type,
        receiverAccountId: String(providerProfile._id),
      });

      expect(created.status).toBe("pending");
      expect(created.relationshipType).toBe(type);
      expect(created.horseName).toBe("Blaze");

      const stored = await Relationship.findById(created.id).lean();
      expect(stored?.status).toBe("pending");
      expect(String(stored?.receiverAccountId)).toBe(String(providerProfile._id));
      expect(String(stored?.receiverUserId)).toBe(String(providerUser._id));
      expect(stored?.referralReference).toMatch(/^REF-/);
    }
  });

  it("creates invite by email for all user-linked types", async () => {
    const owner = await createUser("rel-email-user-owner@example.com");
    const horse = await createHorse(String(owner._id), "Ember");

    for (const type of ["trainer", "farrier", "rider", "coach"] as const) {
      const created = await relationshipService.createRelationshipInvite(String(owner._id), {
        horseId: String(horse._id),
        relationshipType: type,
        invitedEmail: `rel-email-${type}@example.com`,
        invitedName: `Test ${type}`,
      });

      expect(created.status).toBe("pending");
      expect(created.relationshipType).toBe(type);

      const stored = await Relationship.findById(created.id).lean();
      expect(stored?.receiverAccountId).toBeUndefined();
      expect(stored?.invitedEmail).toBe(`rel-email-${type}@example.com`);
    }
  });

  it("creates invite by profile id for entity-owned types (breeder, transport, ridingClub)", async () => {
    const owner = await createUser("rel-entity-owner@example.com", "Alice");
    const horse = await createHorse(String(owner._id), "Duke");

    const entityOwnedTypes = [
      { type: "breeder" as const, createFixture: createTestBreeder },
      { type: "transport" as const, createFixture: createTestTransport },
      { type: "ridingClub" as const, createFixture: createTestRidingClub },
    ];

    for (const { type, createFixture } of entityOwnedTypes) {
      const providerOwner = await createUser(`rel-${type}-entity-owner@example.com`);
      const providerProfile = await createFixture(String(providerOwner._id));

      const created = await relationshipService.createRelationshipInvite(String(owner._id), {
        horseId: String(horse._id),
        relationshipType: type,
        receiverAccountId: String(providerProfile._id),
      });

      expect(created.status).toBe("pending");
      expect(created.relationshipType).toBe(type);

      const stored = await Relationship.findById(created.id).lean();
      expect(stored?.status).toBe("pending");
      expect(String(stored?.receiverAccountId)).toBe(String(providerProfile._id));
    }
  });

  it("rejects email-only invite for entity-owned types via route validation", async () => {
    const owner = await createUser("rel-entity-email-owner@example.com");
    const horse = await createHorse(String(owner._id), "Rex");

    for (const type of ["breeder", "transport", "ridingClub"] as const) {
      const parsed = createRelationshipSchema.safeParse({
        horseId: String(horse._id),
        relationshipType: type,
        invitedEmail: `rel-${type}-no-id@example.com`,
      });

      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues.some((i) => i.path.includes("receiverAccountId"))).toBe(true);
      }
    }
  });

  // --- H-REL-04: End relationship ---

  it("ends an accepted relationship as owner", async () => {
    const owner = await createUser("rel-end-owner@example.com");
    const vetUser = await createUser("rel-end-vet@example.com");
    const horse = await createHorse(String(owner._id), "End Test");
    const veterinary = await createTestVeterinary(String(vetUser._id));

    const created = await relationshipService.createRelationshipInvite(String(owner._id), {
      horseId: String(horse._id),
      relationshipType: "veterinary",
      receiverAccountId: String(veterinary._id),
    });

    await Relationship.findByIdAndUpdate(created.id, {
      $set: { status: "accepted", receiverUserId: vetUser._id, respondedAt: new Date() },
    });

    const ended = await relationshipService.endRelationship(String(owner._id), created.id);
    expect(ended.status).toBe("ended");
    expect(ended.endedAt).toBeDefined();

    const stored = await Relationship.findById(created.id).lean();
    expect(stored?.status).toBe("ended");
  });

  it("ends an accepted relationship as provider", async () => {
    const owner = await createUser("rel-end-provider-owner@example.com");
    const vetUser = await createUser("rel-end-provider-vet@example.com");
    const horse = await createHorse(String(owner._id), "End Provider");
    const veterinary = await createTestVeterinary(String(vetUser._id));

    const created = await relationshipService.createRelationshipInvite(String(owner._id), {
      horseId: String(horse._id),
      relationshipType: "veterinary",
      receiverAccountId: String(veterinary._id),
    });

    await Relationship.findByIdAndUpdate(created.id, {
      $set: { status: "accepted", receiverUserId: vetUser._id, respondedAt: new Date() },
    });

    const ended = await relationshipService.endRelationship(String(vetUser._id), created.id);
    expect(ended.status).toBe("ended");
  });

  it("rejects end from stranger", async () => {
    const owner = await createUser("rel-end-stranger-owner@example.com");
    const vetUser = await createUser("rel-end-stranger-vet@example.com");
    const stranger = await createUser("rel-end-stranger@example.com");
    const horse = await createHorse(String(owner._id), "End Stranger");
    const veterinary = await createTestVeterinary(String(vetUser._id));

    const created = await relationshipService.createRelationshipInvite(String(owner._id), {
      horseId: String(horse._id),
      relationshipType: "veterinary",
      receiverAccountId: String(veterinary._id),
    });

    await Relationship.findByIdAndUpdate(created.id, {
      $set: { status: "accepted", receiverUserId: vetUser._id, respondedAt: new Date() },
    });

    await expect(
      relationshipService.endRelationship(String(stranger._id), created.id),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("rejects end of non-accepted relationship", async () => {
    const owner = await createUser("rel-end-pending-owner@example.com");
    const horse = await createHorse(String(owner._id), "End Pending");

    const created = await relationshipService.createRelationshipInvite(String(owner._id), {
      horseId: String(horse._id),
      relationshipType: "groom",
      invitedEmail: "end-pending-groom@example.com",
    });

    await expect(
      relationshipService.endRelationship(String(owner._id), created.id),
    ).rejects.toBeInstanceOf(ApiError);
  });

  // --- H-REL-05/06: List providers ---

  it("lists accepted providers for horse", async () => {
    const owner = await createUser("rel-list-owner@example.com");
    const vetUser = await createUser("rel-list-vet@example.com");
    const groomUser = await createUser("rel-list-groom@example.com");
    const horse = await createHorse(String(owner._id), "List Test");
    const veterinary = await createTestVeterinary(String(vetUser._id));
    const groom = await createTestGroom(String(groomUser._id));

    const vetRel = await relationshipService.createRelationshipInvite(String(owner._id), {
      horseId: String(horse._id),
      relationshipType: "veterinary",
      receiverAccountId: String(veterinary._id),
    });
    await Relationship.findByIdAndUpdate(vetRel.id, {
      $set: { status: "accepted", receiverUserId: vetUser._id, respondedAt: new Date() },
    });

    const groomRel = await relationshipService.createRelationshipInvite(String(owner._id), {
      horseId: String(horse._id),
      relationshipType: "groom",
      receiverAccountId: String(groom._id),
    });
    await Relationship.findByIdAndUpdate(groomRel.id, {
      $set: { status: "accepted", receiverUserId: groomUser._id, respondedAt: new Date() },
    });

    const providers = await relationshipService.listProvidersForHorse(
      String(owner._id),
      String(horse._id),
      "accepted",
    );

    expect(providers).toHaveLength(2);
    expect(providers.every((p) => p.status === "accepted")).toBe(true);
  });

  it("lists ended providers for horse", async () => {
    const owner = await createUser("rel-list-ended-owner@example.com");
    const vetUser = await createUser("rel-list-ended-vet@example.com");
    const horse = await createHorse(String(owner._id), "List Ended");
    const veterinary = await createTestVeterinary(String(vetUser._id));

    const created = await relationshipService.createRelationshipInvite(String(owner._id), {
      horseId: String(horse._id),
      relationshipType: "veterinary",
      receiverAccountId: String(veterinary._id),
    });
    await Relationship.findByIdAndUpdate(created.id, {
      $set: { status: "accepted", receiverUserId: vetUser._id, respondedAt: new Date() },
    });
    await Relationship.findByIdAndUpdate(created.id, {
      $set: { status: "ended", endedAt: new Date() },
    });

    const providers = await relationshipService.listProvidersForHorse(
      String(owner._id),
      String(horse._id),
      "ended",
    );

    expect(providers).toHaveLength(1);
    expect(providers[0]?.status).toBe("ended");
    expect(providers[0]?.endedAt).toBeDefined();
  });

  it("rejects list providers from non-owner", async () => {
    const owner = await createUser("rel-list-forbid-owner@example.com");
    const stranger = await createUser("rel-list-forbid@example.com");
    const horse = await createHorse(String(owner._id), "List Forbid");

    await expect(
      relationshipService.listProvidersForHorse(String(stranger._id), String(horse._id)),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
