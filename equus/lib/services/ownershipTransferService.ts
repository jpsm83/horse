/**
 * Ownership transfer service — consent-based changes to entity `mainOwnerUserId` and `coOwners[]`.
 *
 * Called by REST routes under `/api/v1/ownership-transfers` (UA-18).
 * Pending state lives on `OwnershipTransfer`; entity fields apply only on accept.
 */

import { randomUUID } from "node:crypto";
import mongoose, { type Model } from "mongoose";
import OwnershipTransfer from "../../models/OwnershipTransfer.ts";
import Horse from "../../models/Horse.ts";
import Stable from "../../models/Stable.ts";
import Breeder from "../../models/Breeder.ts";
import Transport from "../../models/Transport.ts";
import RidingClub from "../../models/RidingClub.ts";
import User from "../../models/User.ts";
import { ApiError } from "../api/errors.ts";
import { reassignHorseSubscriptionPayerAfterTransferMain } from "../horses/horseSubscriptionBilling.ts";
import { guardAcceptTransfer } from "@/lib/billing/subscriptionGuard.ts";
import type {
  ownershipTransferEntityTypeEnums,
  ownershipTransferKindEnums,
} from "../../utils/enums.ts";

export type OwnershipTransferEntityType = (typeof ownershipTransferEntityTypeEnums)[number];
export type OwnershipTransferKind = (typeof ownershipTransferKindEnums)[number];

export type CreateOwnershipTransferInput = {
  entityType: OwnershipTransferEntityType;
  entityId: string;
  transferKind: OwnershipTransferKind;
  receiverUserId?: string;
  targetCoOwnerUserId?: string;
  invitedEmail?: string;
  invitedName?: string;
  requestMessage?: string;
};

export type PublicOwnershipTransfer = {
  id: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  transferKind: string;
  status: string;
  initiatorUserId: string;
  receiverUserId?: string;
  targetCoOwnerUserId?: string;
  invitedEmail?: string;
  referralReference?: string;
  initiatorLabel?: string;
  receiverLabel?: string;
  targetCoOwnerLabel?: string;
  requestedAt?: Date;
  respondedAt?: Date;
};

type EntityConfig = {
  Model: Model<Record<string, unknown>>;
  nameField: string;
};

const ENTITY_CONFIG: Record<OwnershipTransferEntityType, EntityConfig> = {
  horse: { Model: Horse as Model<Record<string, unknown>>, nameField: "name" },
  stable: { Model: Stable as Model<Record<string, unknown>>, nameField: "tradeName" },
  breeder: { Model: Breeder as Model<Record<string, unknown>>, nameField: "operationName" },
  transport: { Model: Transport as Model<Record<string, unknown>>, nameField: "companyName" },
  ridingClub: { Model: RidingClub as Model<Record<string, unknown>>, nameField: "name" },
};

type CoOwnerEntry = { userId?: unknown };

// --- Internal helpers ---

function generateReferralReference(): string {
  return `OT-${randomUUID()}`;
}

function ensureObjectId(id: string, fieldName: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${fieldName}`, "VALIDATION_ERROR");
  }
}

function readEntityName(
  entityType: OwnershipTransferEntityType,
  entity: Record<string, unknown>,
): string | undefined {
  const field = ENTITY_CONFIG[entityType].nameField;
  const value = entity[field];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readCoOwners(entity: Record<string, unknown>): CoOwnerEntry[] {
  return Array.isArray(entity.coOwners) ? (entity.coOwners as CoOwnerEntry[]) : [];
}

function coOwnerUserIds(entity: Record<string, unknown>): string[] {
  return readCoOwners(entity)
    .map((entry) => (entry.userId != null ? String(entry.userId) : null))
    .filter((id): id is string => id !== null);
}

function isMainOwner(actorUserId: string, entity: Record<string, unknown>): boolean {
  return entity.mainOwnerUserId != null && String(entity.mainOwnerUserId) === actorUserId;
}

function assertMainOwner(actorUserId: string, entity: Record<string, unknown>): void {
  if (!isMainOwner(actorUserId, entity)) {
    throw new ApiError(
      403,
      "Only the main owner can initiate ownership transfers",
      "FORBIDDEN",
    );
  }
}

async function loadEntityRecord(
  entityType: OwnershipTransferEntityType,
  entityId: string,
): Promise<Record<string, unknown>> {
  ensureObjectId(entityId, "entity id");

  const { Model } = ENTITY_CONFIG[entityType];
  const entity = await Model.findById(entityId).lean();
  if (!entity) {
    throw new ApiError(404, "Entity not found", "NOT_FOUND");
  }

  return entity as Record<string, unknown>;
}

async function getUserEmail(userId: string): Promise<string | undefined> {
  const user = await User.findById(userId).select("personalDetails.email").lean();
  return (user?.personalDetails as { email?: string } | undefined)?.email
    ?.toLowerCase()
    .trim();
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

async function assertReceiverIdentity(
  actorUserId: string,
  transfer: InstanceType<typeof OwnershipTransfer>,
): Promise<void> {
  if (transfer.receiverUserId && String(transfer.receiverUserId) === actorUserId) {
    return;
  }

  const userEmail = await getUserEmail(actorUserId);
  const invitedEmail = transfer.invitedEmail?.toLowerCase().trim();
  if (userEmail && invitedEmail && userEmail === invitedEmail) {
    return;
  }

  throw new ApiError(403, "You are not the receiver for this transfer", "FORBIDDEN");
}

function toPublicOwnershipTransfer(
  doc: Record<string, unknown>,
  entityName?: string,
): PublicOwnershipTransfer {
  const historical = doc.historicalReference as
    | {
        entityName?: string;
        initiatorLabel?: string;
        receiverLabel?: string;
        targetCoOwnerLabel?: string;
      }
    | undefined;

  return {
    id: String(doc._id),
    entityType: String(doc.entityType),
    entityId: String(doc.entityId),
    entityName: entityName ?? historical?.entityName,
    transferKind: String(doc.transferKind),
    status: String(doc.status),
    initiatorUserId: String(doc.initiatorUserId),
    initiatorLabel: historical?.initiatorLabel,
    receiverLabel: historical?.receiverLabel,
    targetCoOwnerLabel: historical?.targetCoOwnerLabel,
    receiverUserId:
      doc.receiverUserId != null ? String(doc.receiverUserId) : undefined,
    targetCoOwnerUserId:
      doc.targetCoOwnerUserId != null ? String(doc.targetCoOwnerUserId) : undefined,
    invitedEmail: doc.invitedEmail as string | undefined,
    referralReference: doc.referralReference as string | undefined,
    requestedAt: doc.requestedAt as Date | undefined,
    respondedAt: doc.respondedAt as Date | undefined,
  };
}

async function assertNoDuplicatePending(input: {
  entityType: OwnershipTransferEntityType;
  entityId: string;
  transferKind: OwnershipTransferKind;
  receiverUserId?: string;
  targetCoOwnerUserId?: string;
  invitedEmail?: string;
}): Promise<void> {
  const query: Record<string, unknown> = {
    entityType: input.entityType,
    entityId: input.entityId,
    transferKind: input.transferKind,
    status: "pending",
  };

  if (input.receiverUserId) {
    query.receiverUserId = input.receiverUserId;
  } else if (input.targetCoOwnerUserId) {
    query.targetCoOwnerUserId = input.targetCoOwnerUserId;
  } else if (input.invitedEmail) {
    query.invitedEmail = input.invitedEmail.toLowerCase().trim();
  }

  const existing = await OwnershipTransfer.findOne(query).lean();
  if (existing) {
    throw new ApiError(
      409,
      "A pending ownership transfer already exists for this entity and receiver",
      "CONFLICT",
    );
  }
}

function validateCreateInput(
  input: CreateOwnershipTransferInput,
  entity: Record<string, unknown>,
): {
  receiverUserId?: string;
  targetCoOwnerUserId?: string;
  invitedEmail?: string;
  invitedName?: string;
  referralReference?: string;
} {
  const coOwnerIds = coOwnerUserIds(entity);

  if (input.transferKind === "transfer_main") {
    if (coOwnerIds.length > 0) {
      throw new ApiError(
        409,
        "Remove all co-owners before transferring main ownership",
        "CONFLICT",
      );
    }

    if (!input.receiverUserId && !input.invitedEmail?.trim()) {
      throw new ApiError(
        400,
        "Receiver user or invited email is required",
        "VALIDATION_ERROR",
      );
    }

    if (input.targetCoOwnerUserId) {
      throw new ApiError(
        400,
        "targetCoOwnerUserId is not used for transfer_main",
        "VALIDATION_ERROR",
      );
    }
  } else {
    if (!input.targetCoOwnerUserId) {
      throw new ApiError(400, "targetCoOwnerUserId is required", "VALIDATION_ERROR");
    }

    ensureObjectId(input.targetCoOwnerUserId, "target co-owner user id");

    if (!coOwnerIds.includes(input.targetCoOwnerUserId)) {
      throw new ApiError(400, "Target user is not a co-owner", "VALIDATION_ERROR");
    }
  }

  return {};
}

async function resolveReceiverForCreate(
  actorUserId: string,
  input: CreateOwnershipTransferInput,
): Promise<{
  receiverUserId?: string;
  invitedEmail?: string;
  invitedName?: string;
  referralReference?: string;
}> {
  if (input.transferKind === "remove_co_owner" || input.transferKind === "promote_co_owner") {
    const targetId = input.targetCoOwnerUserId!;
    if (targetId === actorUserId) {
      throw new ApiError(400, "Cannot target yourself as co-owner", "VALIDATION_ERROR");
    }
    return { receiverUserId: targetId };
  }

  if (input.receiverUserId) {
    ensureObjectId(input.receiverUserId, "receiver user id");
    if (input.receiverUserId === actorUserId) {
      throw new ApiError(400, "Cannot transfer ownership to yourself", "VALIDATION_ERROR");
    }
    return { receiverUserId: input.receiverUserId };
  }

  const invitedEmail = input.invitedEmail!.toLowerCase().trim();
  const actorEmail = await getUserEmail(actorUserId);
  if (actorEmail && actorEmail === invitedEmail) {
    throw new ApiError(400, "Cannot invite your own email", "VALIDATION_ERROR");
  }

  const existingUser = await User.findOne({ "personalDetails.email": invitedEmail })
    .select("_id")
    .lean();

  return {
    invitedEmail,
    invitedName: input.invitedName?.trim(),
    referralReference: generateReferralReference(),
    receiverUserId: existingUser ? String(existingUser._id) : undefined,
  };
}

async function applyEntityOwnershipChange(
  transfer: InstanceType<typeof OwnershipTransfer>,
  entity: Record<string, unknown>,
): Promise<void> {
  const entityType = transfer.entityType as OwnershipTransferEntityType;
  const { Model } = ENTITY_CONFIG[entityType];
  const entityId = transfer.entityId;
  const mainOwnerUserId = entity.mainOwnerUserId;

  switch (transfer.transferKind) {
    case "transfer_main": {
      if (readCoOwners(entity).length > 0) {
        throw new ApiError(
          409,
          "Remove all co-owners before transferring main ownership",
          "CONFLICT",
        );
      }

      const receiverUserId = transfer.receiverUserId;
      if (!receiverUserId) {
        throw new ApiError(400, "Receiver user is required to accept", "VALIDATION_ERROR");
      }

      const updated = await Model.findOneAndUpdate(
        {
          _id: entityId,
          mainOwnerUserId,
          $or: [
            { coOwners: { $exists: false } },
            { coOwners: { $size: 0 } },
            { coOwners: null },
          ],
        },
        { $set: { mainOwnerUserId: receiverUserId } },
        { returnDocument: "after" },
      );

      if (!updated) {
        throw new ApiError(
          409,
          "Entity ownership changed; transfer cannot apply",
          "CONFLICT",
        );
      }

      if (entityType === "horse") {
        await reassignHorseSubscriptionPayerAfterTransferMain(
          String(entityId),
          String(receiverUserId),
        );
      }
      break;
    }

    case "remove_co_owner": {
      const targetId = transfer.targetCoOwnerUserId;
      if (!targetId) {
        throw new ApiError(400, "Target co-owner is required", "VALIDATION_ERROR");
      }

      const updated = await Model.findOneAndUpdate(
        {
          _id: entityId,
          mainOwnerUserId,
          "coOwners.userId": targetId,
        },
        { $pull: { coOwners: { userId: targetId } } },
        { returnDocument: "after" },
      );

      if (!updated) {
        throw new ApiError(409, "Co-owner is no longer on this entity", "CONFLICT");
      }
      break;
    }

    case "promote_co_owner": {
      const promotedId = transfer.targetCoOwnerUserId;
      if (!promotedId) {
        throw new ApiError(400, "Target co-owner is required", "VALIDATION_ERROR");
      }

      const updated = await Model.findOneAndUpdate(
        {
          _id: entityId,
          mainOwnerUserId,
          "coOwners.userId": promotedId,
        },
        {
          $set: { mainOwnerUserId: promotedId },
          $pull: { coOwners: { userId: promotedId } },
        },
        { returnDocument: "after" },
      );

      if (!updated) {
        throw new ApiError(409, "Co-owner is no longer on this entity", "CONFLICT");
      }
      break;
    }

    default:
      throw new ApiError(400, "Unsupported transfer kind", "VALIDATION_ERROR");
  }
}

// --- Public API ---

export async function createOwnershipTransfer(
  actorUserId: string,
  input: CreateOwnershipTransferInput,
): Promise<PublicOwnershipTransfer> {
  ensureObjectId(input.entityId, "entity id");

  const entity = await loadEntityRecord(input.entityType, input.entityId);
  assertMainOwner(actorUserId, entity);
  validateCreateInput(input, entity);

  const receiver = await resolveReceiverForCreate(actorUserId, input);
  await assertNoDuplicatePending({
    entityType: input.entityType,
    entityId: input.entityId,
    transferKind: input.transferKind,
    receiverUserId: receiver.receiverUserId,
    targetCoOwnerUserId: input.targetCoOwnerUserId,
    invitedEmail: receiver.invitedEmail,
  });

  if (input.transferKind === "transfer_main" && !receiver.receiverUserId) {
    const pendingMain = await OwnershipTransfer.exists({
      entityType: input.entityType,
      entityId: input.entityId,
      transferKind: "transfer_main",
      status: "pending",
    });
    if (pendingMain) {
      throw new ApiError(
        409,
        "A pending main ownership transfer already exists for this entity",
        "CONFLICT",
      );
    }
  }

  const entityName = readEntityName(input.entityType, entity);
  const initiatorLabel = await getUserLabel(actorUserId);
  const receiverLabel = receiver.receiverUserId
    ? await getUserLabel(receiver.receiverUserId)
    : receiver.invitedName;
  const targetCoOwnerLabel = input.targetCoOwnerUserId
    ? await getUserLabel(input.targetCoOwnerUserId)
    : undefined;

  const transfer = await OwnershipTransfer.create({
    entityType: input.entityType,
    entityId: input.entityId,
    transferKind: input.transferKind,
    status: "pending",
    initiatorUserId: actorUserId,
    receiverUserId: receiver.receiverUserId,
    targetCoOwnerUserId: input.targetCoOwnerUserId,
    invitedEmail: receiver.invitedEmail,
    invitedName: receiver.invitedName,
    referralReference: receiver.referralReference,
    requestMessage: input.requestMessage?.trim(),
    historicalReference: {
      entityName,
      initiatorLabel,
      receiverLabel,
      targetCoOwnerLabel,
    },
  });

  return toPublicOwnershipTransfer(
    transfer.toObject() as Record<string, unknown>,
    entityName,
  );
}

export async function listPendingOwnershipTransfersForUser(
  userId: string,
  email: string,
): Promise<PublicOwnershipTransfer[]> {
  const normalizedEmail = email.toLowerCase().trim();

  const transfers = await OwnershipTransfer.find({
    status: "pending",
    $or: [
      { receiverUserId: new mongoose.Types.ObjectId(userId) },
      { invitedEmail: normalizedEmail },
    ],
  })
    .sort({ requestedAt: -1 })
    .lean();

  return transfers.map((doc) =>
    toPublicOwnershipTransfer(doc as Record<string, unknown>),
  );
}

/** Pending ownership transfers sent by the entity owner for a horse (outbound). */
export async function listPendingSentForHorse(
  actorUserId: string,
  horseId: string,
): Promise<PublicOwnershipTransfer[]> {
  ensureObjectId(horseId, "horse id");

  const horse = await Horse.findById(horseId).lean();
  if (!horse) {
    throw new ApiError(404, "Horse not found", "NOT_FOUND");
  }

  if (String((horse as Record<string, unknown>).mainOwnerUserId) !== actorUserId) {
    throw new ApiError(403, "Only the main owner can view sent ownership transfers", "FORBIDDEN");
  }

  const transfers = await OwnershipTransfer.find({
    entityType: "horse",
    entityId: horseId,
    status: "pending",
    initiatorUserId: actorUserId,
  })
    .sort({ requestedAt: -1 })
    .lean();

  const entityName = readEntityName("horse", horse as Record<string, unknown>);

  return transfers.map((doc) =>
    toPublicOwnershipTransfer(doc as Record<string, unknown>, entityName),
  );
}

/** Accepted ownership transfers for a horse (all time, for history view). */
export async function listOwnershipHistoryForHorse(
  actorUserId: string,
  horseId: string,
): Promise<PublicOwnershipTransfer[]> {
  ensureObjectId(horseId, "horse id");

  const horse = await Horse.findById(horseId).lean();
  if (!horse) {
    throw new ApiError(404, "Horse not found", "NOT_FOUND");
  }

  if (String((horse as Record<string, unknown>).mainOwnerUserId) !== actorUserId) {
    throw new ApiError(403, "Only the main owner can view ownership history", "FORBIDDEN");
  }

  const transfers = await OwnershipTransfer.find({
    entityType: "horse",
    entityId: horseId,
    status: "accepted",
  })
    .sort({ respondedAt: -1 })
    .lean();

  const entityName = readEntityName("horse", horse as Record<string, unknown>);

  return transfers.map((doc) =>
    toPublicOwnershipTransfer(doc as Record<string, unknown>, entityName),
  );
}

export async function acceptOwnershipTransfer(
  actorUserId: string,
  transferId: string,
): Promise<PublicOwnershipTransfer> {
  ensureObjectId(transferId, "transfer id");

  const transfer = await OwnershipTransfer.findById(transferId);
  if (!transfer) {
    throw new ApiError(404, "Ownership transfer not found", "NOT_FOUND");
  }

  if (transfer.status !== "pending") {
    throw new ApiError(400, "Ownership transfer is not pending", "VALIDATION_ERROR");
  }

  await assertReceiverIdentity(actorUserId, transfer);

  const entityType = transfer.entityType as OwnershipTransferEntityType;
  const entity = await loadEntityRecord(entityType, String(transfer.entityId));

  if (!transfer.receiverUserId) {
    transfer.receiverUserId = new mongoose.Types.ObjectId(actorUserId);
  }

  if (transfer.transferKind === "transfer_main") {
    const guard = await guardAcceptTransfer(actorUserId);
    if (!guard.ok) {
      throw new ApiError(
        403,
        `Cannot accept horse: subscription limit reached (${guard.current}/${guard.limit}). Upgrade to ${guard.requiredTier} to accept.`,
        guard.code,
      );
    }
  }

  await applyEntityOwnershipChange(transfer, entity);

  transfer.status = "accepted";
  transfer.respondedAt = new Date();
  await transfer.save();

  const entityName = readEntityName(entityType, entity);
  return toPublicOwnershipTransfer(
    transfer.toObject() as Record<string, unknown>,
    entityName,
  );
}

export async function declineOwnershipTransfer(
  actorUserId: string,
  transferId: string,
): Promise<PublicOwnershipTransfer> {
  ensureObjectId(transferId, "transfer id");

  const transfer = await OwnershipTransfer.findById(transferId);
  if (!transfer) {
    throw new ApiError(404, "Ownership transfer not found", "NOT_FOUND");
  }

  if (transfer.status !== "pending") {
    throw new ApiError(400, "Ownership transfer is not pending", "VALIDATION_ERROR");
  }

  await assertReceiverIdentity(actorUserId, transfer);

  transfer.receiverUserId = new mongoose.Types.ObjectId(actorUserId);
  transfer.status = "declined";
  transfer.respondedAt = new Date();
  await transfer.save();

  const entityType = transfer.entityType as OwnershipTransferEntityType;
  const entity = await loadEntityRecord(entityType, String(transfer.entityId));
  const entityName = readEntityName(entityType, entity);

  return toPublicOwnershipTransfer(
    transfer.toObject() as Record<string, unknown>,
    entityName,
  );
}

export async function cancelOwnershipTransfer(
  actorUserId: string,
  transferId: string,
): Promise<PublicOwnershipTransfer> {
  ensureObjectId(transferId, "transfer id");

  const transfer = await OwnershipTransfer.findById(transferId);
  if (!transfer) {
    throw new ApiError(404, "Ownership transfer not found", "NOT_FOUND");
  }

  if (transfer.status !== "pending") {
    throw new ApiError(400, "Ownership transfer is not pending", "VALIDATION_ERROR");
  }

  if (String(transfer.initiatorUserId) !== actorUserId) {
    throw new ApiError(403, "Only the initiator can cancel this transfer", "FORBIDDEN");
  }

  transfer.status = "cancelled";
  transfer.respondedAt = new Date();
  await transfer.save();

  const entityType = transfer.entityType as OwnershipTransferEntityType;
  const entity = await loadEntityRecord(entityType, String(transfer.entityId));
  const entityName = readEntityName(entityType, entity);

  return toPublicOwnershipTransfer(
    transfer.toObject() as Record<string, unknown>,
    entityName,
  );
}
