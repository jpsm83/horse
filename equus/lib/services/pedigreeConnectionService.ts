/**
 * Pedigree connection service — parent-owner acknowledgment of sire/dam links.
 *
 * Writes only Horse.pedigree.sire*|dam* on the child horse on accept.
 * Never changes ownership on either horse.
 */

import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import PedigreeConnection from "../../models/PedigreeConnection.ts";
import Horse from "../../models/Horse.ts";
import User from "../../models/User.ts";
import { ApiError } from "../api/errors.ts";
import { sendPedigreeConnectInviteEmail } from "../email/sendPedigreeConnectInviteEmail.ts";
import type { pedigreeConnectionRoleEnums } from "../../utils/enums.ts";

export type PedigreeRole = (typeof pedigreeConnectionRoleEnums)[number];

export type CreatePedigreeConnectionInput = {
  childHorseId: string;
  role: PedigreeRole;
  parentHorseId?: string;
  parentHorseName?: string;
  invitedEmail?: string;
  invitedName?: string;
};

export type PublicPedigreeConnection = {
  id: string;
  childHorseId: string;
  childHorseName?: string;
  role: string;
  status: string;
  initiatorUserId: string;
  receiverUserId?: string;
  invitedEmail?: string;
  referralReference?: string;
  initiatorLabel?: string;
  receiverLabel?: string;
  parentHorseId?: string;
  parentHorseName?: string;
  requestedAt?: Date;
  respondedAt?: Date;
};

function generateReferralReference(): string {
  return `PC-${randomUUID()}`;
}

function ensureObjectId(id: string, fieldName: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${fieldName}`, "VALIDATION_ERROR");
  }
}

async function getUserLabel(userId: string): Promise<string> {
  const user = await User.findById(userId)
    .select("personalDetails.firstName personalDetails.lastName personalDetails.username")
    .lean();
  const pd = user?.personalDetails as
    | { firstName?: string; lastName?: string; username?: string }
    | undefined;
  return (
    [pd?.firstName, pd?.lastName].filter(Boolean).join(" ").trim() ||
    pd?.username?.trim() ||
    "A user"
  );
}

async function getUserEmail(userId: string): Promise<string | undefined> {
  const user = await User.findById(userId).select("personalDetails.email").lean();
  return (user?.personalDetails as { email?: string } | undefined)?.email
    ?.toLowerCase()
    .trim();
}

function toPublic(
  doc: Record<string, unknown>,
  childHorseName?: string,
): PublicPedigreeConnection {
  const hist = doc.historicalReference as
    | { childHorseName?: string; initiatorLabel?: string; receiverLabel?: string; parentHorseName?: string }
    | undefined;

  return {
    id: String(doc._id),
    childHorseId: String(doc.childHorseId),
    childHorseName: childHorseName ?? hist?.childHorseName,
    role: doc.role as string,
    status: doc.status as string,
    initiatorUserId: String(doc.initiatorUserId),
    receiverUserId: doc.receiverUserId != null ? String(doc.receiverUserId) : undefined,
    invitedEmail: doc.invitedEmail as string | undefined,
    referralReference: doc.referralReference as string | undefined,
    initiatorLabel: hist?.initiatorLabel,
    receiverLabel: hist?.receiverLabel,
    parentHorseId: doc.parentHorseId != null ? String(doc.parentHorseId) : undefined,
    parentHorseName:
      (doc.parentHorseName as string | undefined) ?? hist?.parentHorseName,
    requestedAt: doc.requestedAt as Date | undefined,
    respondedAt: doc.respondedAt as Date | undefined,
  };
}

async function assertCanRespond(
  actorUserId: string,
  connection: Record<string, unknown>,
): Promise<void> {
  if (connection.status !== "pending") {
    throw new ApiError(409, "Connection is not pending", "CONFLICT");
  }

  const receiverId = connection.receiverUserId != null ? String(connection.receiverUserId) : undefined;
  if (receiverId && receiverId === actorUserId) return;

  const userEmail = await getUserEmail(actorUserId);
  const invitedEmail = (connection.invitedEmail as string | undefined)?.toLowerCase().trim();
  if (userEmail && invitedEmail && userEmail === invitedEmail) return;

  throw new ApiError(403, "Only the invited parent owner can respond", "FORBIDDEN");
}

export async function createPedigreeConnection(
  actorUserId: string,
  input: CreatePedigreeConnectionInput,
): Promise<PublicPedigreeConnection> {
  ensureObjectId(input.childHorseId, "child horse id");

  const child = await Horse.findById(input.childHorseId)
    .select(
      "name mainOwnerUserId breed sex dateOfBirth registryId microchipId passportNumber registration.isActive",
    )
    .lean();
  if (!child || !(child.registration as { isActive?: boolean } | undefined)?.isActive) {
    throw new ApiError(404, "Child horse not found or inactive", "NOT_FOUND");
  }
  if (String(child.mainOwnerUserId) !== actorUserId) {
    throw new ApiError(403, "Only the main owner can request a pedigree connection", "FORBIDDEN");
  }

  let parentHorseId: string | undefined;
  let parentHorseName: string | undefined;
  let receiverUserId: string | undefined;
  let invitedEmail: string | undefined;
  let invitedName: string | undefined;
  let referralReference: string | undefined;

  if (input.parentHorseId) {
    ensureObjectId(input.parentHorseId, "parent horse id");
    const parent = await Horse.findById(input.parentHorseId)
      .select("name mainOwnerUserId registration.isActive")
      .lean();
    if (!parent || !(parent.registration as { isActive?: boolean } | undefined)?.isActive) {
      throw new ApiError(404, "Parent horse not found or inactive", "NOT_FOUND");
    }
    if (String(parent.mainOwnerUserId) === actorUserId) {
      throw new ApiError(400, "Cannot connect to your own horse", "VALIDATION_ERROR");
    }
    parentHorseId = String(parent._id);
    parentHorseName = parent.name as string;
    receiverUserId = String(parent.mainOwnerUserId);
  } else {
    parentHorseName = input.parentHorseName!.trim();
    invitedEmail = input.invitedEmail!.toLowerCase().trim();
    invitedName = input.invitedName?.trim();
    const actorEmail = await getUserEmail(actorUserId);
    if (actorEmail && actorEmail === invitedEmail) {
      throw new ApiError(400, "Cannot invite your own email", "VALIDATION_ERROR");
    }

    const existingUser = await User.findOne({ "personalDetails.email": invitedEmail })
      .select("_id")
      .lean();
    receiverUserId = existingUser ? String(existingUser._id) : undefined;
    referralReference = generateReferralReference();
  }

  const duplicate = await PedigreeConnection.exists({
    childHorseId: input.childHorseId,
    role: input.role,
    status: "pending",
  });
  if (duplicate) {
    throw new ApiError(
      409,
      "A pending pedigree connection already exists for this role",
      "CONFLICT",
    );
  }

  const initiatorLabel = await getUserLabel(actorUserId);
  const receiverLabel = receiverUserId
    ? await getUserLabel(receiverUserId)
    : invitedName;
  const childHorseName = child.name as string;

  const connection = await PedigreeConnection.create({
    childHorseId: input.childHorseId,
    role: input.role,
    status: "pending",
    initiatorUserId: actorUserId,
    receiverUserId,
    invitedEmail,
    invitedName,
    referralReference,
    parentHorseId,
    parentHorseName,
    historicalReference: {
      childHorseName,
      initiatorLabel,
      receiverLabel,
      parentHorseName,
      role: input.role,
    },
  });

  const toEmail =
    invitedEmail ??
    (receiverUserId ? await getUserEmail(receiverUserId) : undefined);

  if (!toEmail) {
    await PedigreeConnection.deleteOne({ _id: connection._id });
    throw new ApiError(400, "Could not resolve receiver email for invitation", "VALIDATION_ERROR");
  }

  try {
    await sendPedigreeConnectInviteEmail({
      connectionId: String(connection._id),
      invitedEmail: toEmail,
      invitedName,
      referralReference: referralReference ?? "",
      locale: undefined,
      inviteeUserId: receiverUserId,
      initiatorLabel,
      role: input.role,
      parentHorseName: parentHorseName ?? "Unknown",
      childHorseName,
      childBreed: child.breed as string | undefined,
      childSex: child.sex as string | undefined,
      childDateOfBirth: child.dateOfBirth as Date | undefined,
      childRegistryId: child.registryId as string | undefined,
      childMicrochipId: child.microchipId as string | undefined,
      childPassportNumber: child.passportNumber as string | undefined,
    });
  } catch (error) {
    await PedigreeConnection.deleteOne({ _id: connection._id });
    throw error;
  }

  return toPublic(connection.toObject() as Record<string, unknown>, childHorseName);
}

export async function listPendingPedigreeConnectionsForUser(
  userId: string,
  email: string,
): Promise<PublicPedigreeConnection[]> {
  const normalizedEmail = email.toLowerCase().trim();

  const docs = await PedigreeConnection.find({
    status: "pending",
    $or: [
      { receiverUserId: new mongoose.Types.ObjectId(userId) },
      { invitedEmail: normalizedEmail },
    ],
  })
    .sort({ requestedAt: -1 })
    .lean();

  return docs.map((doc) => toPublic(doc as Record<string, unknown>));
}

export async function acceptPedigreeConnection(
  actorUserId: string,
  connectionId: string,
): Promise<PublicPedigreeConnection> {
  ensureObjectId(connectionId, "connection id");

  const connection = await PedigreeConnection.findById(connectionId);
  if (!connection) {
    throw new ApiError(404, "Pedigree connection not found", "NOT_FOUND");
  }

  await assertCanRespond(actorUserId, connection.toObject() as Record<string, unknown>);

  if (!connection.receiverUserId) {
    connection.receiverUserId = new mongoose.Types.ObjectId(actorUserId);
  } else if (String(connection.receiverUserId) !== actorUserId) {
    throw new ApiError(403, "Only the invited parent owner can accept", "FORBIDDEN");
  }

  const role = connection.role as PedigreeRole;
  const field = role === "sire" ? "sireHorseId" : "damHorseId";
  const nameField = role === "sire" ? "sireName" : "damName";
  const childHorseId = connection.childHorseId;

  let parentHorseId = connection.parentHorseId
    ? String(connection.parentHorseId)
    : undefined;
  let parentHorseName = connection.parentHorseName as string | undefined;

  if (parentHorseId) {
    const parent = await Horse.findById(parentHorseId)
      .select("name mainOwnerUserId registration.isActive")
      .lean();
    if (!parent || !(parent.registration as { isActive?: boolean } | undefined)?.isActive) {
      throw new ApiError(404, "Parent horse not found or inactive", "NOT_FOUND");
    }
    if (String(parent.mainOwnerUserId) !== actorUserId) {
      throw new ApiError(403, "You must be the main owner of the parent horse", "FORBIDDEN");
    }
    parentHorseName = parent.name as string;
  } else {
    const horseName = parentHorseName?.trim();
    if (!horseName) {
      throw new ApiError(400, "Horse name is required to create a pedigree connection", "VALIDATION_ERROR");
    }

    // Stub parent — identity IDs optional at create; owner fills them on profile later.
    const newHorse = await Horse.create({
      name: horseName,
      breed: "Other",
      sex: role === "sire" ? "Stallion" : "Mare",
      mainOwnerUserId: actorUserId,
      createdByUserId: actorUserId,
      registration: { addedAt: new Date(), isActive: true, payerUserId: actorUserId },
    });
    parentHorseId = String(newHorse._id);
    parentHorseName = newHorse.name as string;
    connection.parentHorseId = newHorse._id;
  }

  const updated = await Horse.findOneAndUpdate(
    { _id: childHorseId },
    {
      $set: {
        [`pedigree.${field}`]: new mongoose.Types.ObjectId(parentHorseId),
        [`pedigree.${nameField}`]: parentHorseName,
      },
    },
    { returnDocument: "after" },
  );

  if (!updated) {
    throw new ApiError(404, "Child horse not found", "NOT_FOUND");
  }

  connection.status = "accepted";
  connection.respondedAt = new Date();
  await connection.save();

  return toPublic(connection.toObject() as Record<string, unknown>);
}

export async function declinePedigreeConnection(
  actorUserId: string,
  connectionId: string,
): Promise<PublicPedigreeConnection> {
  ensureObjectId(connectionId, "connection id");

  const connection = await PedigreeConnection.findById(connectionId);
  if (!connection) {
    throw new ApiError(404, "Pedigree connection not found", "NOT_FOUND");
  }

  await assertCanRespond(actorUserId, connection.toObject() as Record<string, unknown>);

  connection.status = "declined";
  connection.respondedAt = new Date();
  if (!connection.receiverUserId) {
    connection.receiverUserId = new mongoose.Types.ObjectId(actorUserId);
  }
  await connection.save();

  return toPublic(connection.toObject() as Record<string, unknown>);
}

export async function cancelPedigreeConnection(
  actorUserId: string,
  connectionId: string,
): Promise<PublicPedigreeConnection> {
  ensureObjectId(connectionId, "connection id");

  const connection = await PedigreeConnection.findById(connectionId);
  if (!connection) {
    throw new ApiError(404, "Pedigree connection not found", "NOT_FOUND");
  }

  if (connection.status !== "pending") {
    throw new ApiError(409, "Connection is not pending", "CONFLICT");
  }

  if (String(connection.initiatorUserId) !== actorUserId) {
    throw new ApiError(403, "Only the initiator can cancel", "FORBIDDEN");
  }

  connection.status = "cancelled";
  connection.respondedAt = new Date();
  await connection.save();

  return toPublic(connection.toObject() as Record<string, unknown>);
}
