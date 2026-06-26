/**
 * Relationship service — pending invites, accept/decline, signup linking by referral.
 *
 * Called by REST routes under app/api/v1/users/me/relationships and
 * app/api/v1/relationships/[id]. Creating relationship invites is a separate horse flow.
 */

import mongoose from "mongoose";
import Relationship from "../../models/Relationship.ts";
import Horse from "../../models/Horse.ts";
import User from "../../models/User.ts";
import { ApiError } from "../api/errors.ts";

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

async function getUserEmail(userId: string): Promise<string | undefined> {
  const user = await User.findById(userId).select("personalDetails.email").lean();
  return (user?.personalDetails as { email?: string } | undefined)?.email
    ?.toLowerCase()
    .trim();
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
