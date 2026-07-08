/**
 * Relationship service — invite creation, pending list, accept/decline, signup linking.
 *
 * Invitation policy: horse owners only may create invites (`createRelationshipInvite`).
 * Providers accept or decline; they never initiate horse links.
 *
 * Called by REST routes under app/api/v1/relationships and users/me/relationships.
 */

import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import Relationship from "../../models/Relationship.ts";
import Horse from "../../models/Horse.ts";
import User from "../../models/User.ts";
import { ApiError } from "../api/errors.ts";
import { userOwnsEntity } from "../ownership/entityOwnership.ts";
import {
  isUserLinkedRelationshipTypeForBackfill,
  resolveProviderProfile,
  USER_LINKED_PROFILE_FIELD_BY_TYPE,
} from "../relationships/roleProfileResolver.ts";
import { sendRelationshipInviteEmail } from "../email/sendRelationshipInviteEmail.ts";
import type { CreateRelationshipInput } from "../validations/relationship.ts";

export type PublicRelationship = {
  id: string;
  horseId: string;
  horseName?: string;
  relationshipType: string;
  status: string;
  requesterLabel?: string;
  invitedEmail?: string;
  referralReference?: string;
  requestedAt?: Date;
};

export type RelationshipInvitePreview = {
  kind: "relationship";
  horseName?: string;
  relationshipType?: string;
  requesterLabel?: string;
};

// --- Internal helpers ---

function generateRelationshipReferralReference(): string {
  return `REF-${randomUUID()}`;
}

async function getUserEmail(userId: string): Promise<string | undefined> {
  const user = await User.findById(userId).select("personalDetails.email").lean();
  return (user?.personalDetails as { email?: string } | undefined)?.email
    ?.toLowerCase()
    .trim();
}

async function getRequesterLabel(userId: string): Promise<string> {
  const user = await User.findById(userId)
    .select("personalDetails.firstName personalDetails.lastName personalDetails.username")
    .lean();

  const pd = user?.personalDetails as
    | { firstName?: string; lastName?: string; username?: string }
    | undefined;
  return (
    [pd?.firstName, pd?.lastName].filter(Boolean).join(" ").trim() ||
    pd?.username?.trim() ||
    "A horse owner"
  );
}

async function assertReceiverIdentity(
  userId: string,
  relationship: InstanceType<typeof Relationship>,
) {
  if (
    relationship.receiverUserId &&
    String(relationship.receiverUserId) === userId
  ) {
    return;
  }

  const userEmail = await getUserEmail(userId);
  const invitedEmail = relationship.invitedEmail?.toLowerCase().trim();

  if (userEmail && invitedEmail && userEmail === invitedEmail) {
    return;
  }

  throw new ApiError(403, "You are not the invitee for this relationship", "FORBIDDEN");
}

async function resolveHorseName(horseId: mongoose.Types.ObjectId | string): Promise<string | undefined> {
  const horse = await Horse.findById(horseId).select("name").lean();
  return (horse as { name?: string } | null)?.name;
}

async function backfillReceiverAccountId(
  userId: string,
  relationshipType: string,
): Promise<string | undefined> {
  if (!isUserLinkedRelationshipTypeForBackfill(relationshipType)) {
    return undefined;
  }

  const field = USER_LINKED_PROFILE_FIELD_BY_TYPE[relationshipType];
  const user = await User.findById(userId).select(field).lean();
  if (!user) return undefined;

  const profileId = (user as Record<string, unknown>)[field];
  return profileId != null ? String(profileId) : undefined;
}

function toPublicRelationship(doc: Record<string, unknown>): PublicRelationship {
  const historical = doc.historicalReference as
    | { requesterLabel?: string; horseNameSnapshot?: string }
    | undefined;

  return {
    id: String(doc._id),
    horseId: String(doc.horseId),
    horseName: historical?.horseNameSnapshot,
    relationshipType: String(doc.relationshipType),
    status: String(doc.status),
    requesterLabel: historical?.requesterLabel,
    invitedEmail: doc.invitedEmail as string | undefined,
    referralReference: doc.referralReference as string | undefined,
    requestedAt: doc.requestedAt as Date | undefined,
  };
}

// --- Public API ---

export async function createRelationshipInvite(
  actorUserId: string,
  input: CreateRelationshipInput,
): Promise<PublicRelationship> {
  if (!mongoose.Types.ObjectId.isValid(input.horseId)) {
    throw new ApiError(400, "Invalid horse id", "VALIDATION_ERROR");
  }

  const horse = await Horse.findById(input.horseId).lean();
  if (!horse) {
    throw new ApiError(404, "Horse not found", "NOT_FOUND");
  }

  const horseRecord = horse as Record<string, unknown>;
  if (!userOwnsEntity(actorUserId, horseRecord)) {
    throw new ApiError(403, "You do not own this horse", "FORBIDDEN");
  }

  const horseName = String(horseRecord.name ?? "");
  const requesterLabel = await getRequesterLabel(actorUserId);
  const relationshipType = input.relationshipType;

  let receiverAccountId: string | undefined;
  let receiverUserId: string | undefined;
  let invitedEmail: string | undefined;
  let receiverLabel: string | undefined;
  const referralReference = generateRelationshipReferralReference();

  if (input.receiverAccountId) {
    const provider = await resolveProviderProfile(relationshipType, input.receiverAccountId);
    if (!provider) {
      throw new ApiError(404, "Provider profile not found", "NOT_FOUND");
    }

    if (provider.accountType !== relationshipType) {
      throw new ApiError(400, "Provider profile type does not match relationship type", "VALIDATION_ERROR");
    }

    if (provider.operatorUserId === actorUserId) {
      throw new ApiError(400, "Cannot invite your own provider profile", "VALIDATION_ERROR");
    }

    receiverAccountId = provider.profileId;
    receiverUserId = provider.operatorUserId;
    receiverLabel = provider.displayLabel || undefined;
    invitedEmail = provider.contactEmail ?? (await getUserEmail(provider.operatorUserId));
  } else if (input.invitedEmail) {
    invitedEmail = input.invitedEmail.toLowerCase().trim();

    const actorEmail = await getUserEmail(actorUserId);
    if (actorEmail && actorEmail === invitedEmail) {
      throw new ApiError(400, "Cannot invite your own email", "VALIDATION_ERROR");
    }

    const existingUser = await User.findOne({ "personalDetails.email": invitedEmail })
      .select("_id personalDetails.preferredLanguage")
      .lean();

    if (existingUser) {
      receiverUserId = String(existingUser._id);
    }
  }

  const duplicateQuery = receiverAccountId
    ? {
        horseId: input.horseId,
        relationshipType,
        status: "pending",
        receiverAccountId,
      }
    : {
        horseId: input.horseId,
        relationshipType,
        status: "pending",
        invitedEmail,
      };

  const existingPending = await Relationship.findOne(duplicateQuery).lean();
  if (existingPending) {
    throw new ApiError(
      409,
      "A pending relationship already exists for this horse and provider",
      "CONFLICT",
    );
  }

  if (receiverAccountId) {
    const acceptedDuplicate = await Relationship.findOne({
      horseId: input.horseId,
      receiverAccountType: relationshipType,
      receiverAccountId,
      status: "accepted",
    }).lean();

    if (acceptedDuplicate) {
      throw new ApiError(
        409,
        "An accepted relationship already exists for this horse and provider",
        "CONFLICT",
      );
    }
  }

  const relationship = await Relationship.create({
    horseId: input.horseId,
    relationshipType,
    status: "pending",
    requesterUserId: actorUserId,
    receiverAccountType: relationshipType,
    ...(receiverAccountId ? { receiverAccountId } : {}),
    ...(receiverUserId ? { receiverUserId } : {}),
    ...(invitedEmail ? { invitedEmail } : {}),
    ...(input.invitedName ? { invitedName: input.invitedName.trim() } : {}),
    referralReference,
    requestMessage: input.requestMessage?.trim(),
    historicalReference: {
      requesterLabel,
      receiverLabel,
      horseNameSnapshot: horseName,
    },
  });

  if (invitedEmail) {
    try {
      let inviteeLocale: string | undefined;
      if (receiverUserId) {
        const invitee = await User.findById(receiverUserId)
          .select("personalDetails.preferredLanguage")
          .lean();
        inviteeLocale = (
          invitee?.personalDetails as { preferredLanguage?: string } | undefined
        )?.preferredLanguage;
      }

      await sendRelationshipInviteEmail({
        relationshipId: String(relationship._id),
        invitedEmail,
        invitedName: input.invitedName?.trim(),
        horseName,
        relationshipType,
        requesterLabel,
        referralReference,
        locale: inviteeLocale,
        inviteeUserId: receiverUserId,
        variant: "ownerInvitesProvider",
      });
    } catch {
      // Invite persists even when email delivery fails (same as workplace invites).
    }
  }

  const pub = toPublicRelationship(relationship.toObject() as Record<string, unknown>);
  pub.horseName = horseName;
  return pub;
}

export async function listPendingForUser(
  userId: string,
  email: string,
): Promise<PublicRelationship[]> {
  const normalizedEmail = email.toLowerCase().trim();

  const relationships = await Relationship.find({
    status: "pending",
    $or: [
      { receiverUserId: new mongoose.Types.ObjectId(userId) },
      { invitedEmail: normalizedEmail },
    ],
  })
    .sort({ requestedAt: -1 })
    .lean();

  const results: PublicRelationship[] = [];

  for (const doc of relationships) {
    const pub = toPublicRelationship(doc as Record<string, unknown>);
    const horseName = await resolveHorseName(doc.horseId as mongoose.Types.ObjectId);
    if (horseName) pub.horseName = horseName;
    results.push(pub);
  }

  return results;
}

/** Pending invites sent by the horse owner for a specific horse (outbound). */
export async function listPendingSentForHorse(
  actorUserId: string,
  horseId: string,
): Promise<PublicRelationship[]> {
  if (!mongoose.Types.ObjectId.isValid(horseId)) {
    throw new ApiError(400, "Invalid horse id", "VALIDATION_ERROR");
  }

  const horse = await Horse.findById(horseId).lean();
  if (!horse) {
    throw new ApiError(404, "Horse not found", "NOT_FOUND");
  }

  if (!userOwnsEntity(actorUserId, horse as Record<string, unknown>)) {
    throw new ApiError(403, "You do not own this horse", "FORBIDDEN");
  }

  const relationships = await Relationship.find({
    horseId,
    status: "pending",
    requesterUserId: actorUserId,
  })
    .sort({ requestedAt: -1 })
    .lean();

  const results: PublicRelationship[] = [];
  const horseName = await resolveHorseName(horseId);

  for (const doc of relationships) {
    const pub = toPublicRelationship(doc as Record<string, unknown>);
    if (horseName) pub.horseName = horseName;
    results.push(pub);
  }

  return results;
}

export async function acceptRelationship(
  userId: string,
  relationshipId: string,
): Promise<PublicRelationship> {
  const relationship = await Relationship.findById(relationshipId);
  if (!relationship) {
    throw new ApiError(404, "Relationship not found", "NOT_FOUND");
  }

  if (relationship.status !== "pending") {
    throw new ApiError(400, "Relationship is not pending", "VALIDATION_ERROR");
  }

  await assertReceiverIdentity(userId, relationship);

  if (!relationship.receiverAccountId) {
    const backfilledId = await backfillReceiverAccountId(
      userId,
      String(relationship.relationshipType),
    );
    if (backfilledId) {
      relationship.receiverAccountId = new mongoose.Types.ObjectId(backfilledId);
    }
  }

  relationship.receiverUserId = new mongoose.Types.ObjectId(userId);
  relationship.status = "accepted";
  relationship.respondedAt = new Date();
  await relationship.save();

  const pub = toPublicRelationship(relationship.toObject() as Record<string, unknown>);
  pub.horseName = await resolveHorseName(relationship.horseId);
  return pub;
}

export async function declineRelationship(
  userId: string,
  relationshipId: string,
): Promise<PublicRelationship> {
  const relationship = await Relationship.findById(relationshipId);
  if (!relationship) {
    throw new ApiError(404, "Relationship not found", "NOT_FOUND");
  }

  if (relationship.status !== "pending") {
    throw new ApiError(400, "Relationship is not pending", "VALIDATION_ERROR");
  }

  await assertReceiverIdentity(userId, relationship);

  relationship.receiverUserId = new mongoose.Types.ObjectId(userId);
  relationship.status = "declined";
  relationship.respondedAt = new Date();
  await relationship.save();

  const pub = toPublicRelationship(relationship.toObject() as Record<string, unknown>);
  pub.horseName = await resolveHorseName(relationship.horseId);
  return pub;
}

export async function linkRelationshipByReferral(
  referralReference: string,
  userId: string,
  email: string,
): Promise<number> {
  const normalizedRef = referralReference.trim();
  const normalizedEmail = email.toLowerCase().trim();

  const result = await Relationship.updateMany(
    {
      referralReference: normalizedRef,
      status: "pending",
      invitedEmail: normalizedEmail,
      $or: [{ receiverUserId: { $exists: false } }, { receiverUserId: null }],
    },
    { $set: { receiverUserId: new mongoose.Types.ObjectId(userId) } },
  );

  return result.modifiedCount;
}

export async function getInvitePreviewByReferral(
  referralReference: string,
): Promise<RelationshipInvitePreview | null> {
  const relationship = await Relationship.findOne({
    referralReference: referralReference.trim(),
    status: "pending",
  }).lean();

  if (!relationship) return null;

  const historical = relationship.historicalReference as
    | { requesterLabel?: string; horseNameSnapshot?: string }
    | undefined;
  const horseName =
    (await resolveHorseName(relationship.horseId as mongoose.Types.ObjectId)) ??
    historical?.horseNameSnapshot;

  return {
    kind: "relationship",
    horseName,
    relationshipType: relationship.relationshipType as string,
    requesterLabel: historical?.requesterLabel,
  };
}
