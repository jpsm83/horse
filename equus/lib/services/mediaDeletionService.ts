import mongoose from "mongoose";
import Horse from "@/models/Horse.ts";
import Media from "@/models/Media.ts";
import MediaDeletionRequest from "@/models/MediaDeletionRequest.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { ownedByUserQuery } from "@/lib/ownership/entityOwnership.ts";
import * as mediaService from "@/lib/services/mediaService.ts";
import { createNotification } from "@/lib/services/notificationService.ts";

type DeletionRequestRecord = {
  _id: mongoose.Types.ObjectId;
  horseId: mongoose.Types.ObjectId;
  mediaId: mongoose.Types.ObjectId;
  requesterUserId: mongoose.Types.ObjectId;
  decisionByUserId?: mongoose.Types.ObjectId;
  status: string;
  requestMessage?: string;
  responseMessage?: string;
  requestedAt: Date;
  respondedAt?: Date;
  appliedAt?: Date;
};

export type PublicDeletionRequest = {
  id: string;
  horseId: string;
  mediaId: string;
  requesterUserId: string;
  decisionByUserId?: string;
  status: string;
  requestMessage?: string;
  responseMessage?: string;
  requestedAt: string;
  respondedAt?: string;
  appliedAt?: string;
};

function toPublic(record: Record<string, unknown>): PublicDeletionRequest {
  return {
    id: String(record._id),
    horseId: String(record.horseId),
    mediaId: String(record.mediaId),
    requesterUserId: String(record.requesterUserId),
    decisionByUserId: record.decisionByUserId
      ? String(record.decisionByUserId)
      : undefined,
    status: record.status as string,
    requestMessage: record.requestMessage as string | undefined,
    responseMessage: record.responseMessage as string | undefined,
    requestedAt: (record.requestedAt as Date).toISOString(),
    respondedAt: record.respondedAt
      ? (record.respondedAt as Date).toISOString()
      : undefined,
    appliedAt: record.appliedAt
      ? (record.appliedAt as Date).toISOString()
      : undefined,
  };
}

async function getHorseOwners(horseId: string): Promise<string[]> {
  const horse = await Horse.findById(horseId)
    .select("mainOwnerUserId coOwners")
    .lean();
  if (!horse) return [];

  const ids: string[] = [String(horse.mainOwnerUserId)];
  const coOwners = horse.coOwners as { userId?: unknown }[] | undefined;
  if (coOwners) {
    for (const co of coOwners) {
      if (co.userId) ids.push(String(co.userId));
    }
  }
  return ids;
}

export async function createDeletionRequest(
  requesterUserId: string,
  horseId: string,
  mediaId: string,
  requestMessage?: string,
): Promise<PublicDeletionRequest> {
  if (!mongoose.Types.ObjectId.isValid(mediaId)) {
    throw new ApiError(400, "Invalid media id", "VALIDATION_ERROR");
  }
  if (!mongoose.Types.ObjectId.isValid(horseId)) {
    throw new ApiError(400, "Invalid horse id", "VALIDATION_ERROR");
  }

  const horse = await Horse.findOne({
    _id: horseId,
    ...ownedByUserQuery(requesterUserId),
  })
    .select("_id")
    .lean();
  if (horse) {
    throw new ApiError(
      400,
      "Owners cannot request deletion — use the direct delete endpoint",
      "VALIDATION_ERROR",
    );
  }

  const media = await Media.findOne({ _id: mediaId, horseId })
    .select("_id")
    .lean();
  if (!media) {
    throw new ApiError(404, "Media not found", "NOT_FOUND");
  }

  const existing = await MediaDeletionRequest.findOne({
    mediaId,
    status: "pending",
  })
    .select("_id")
    .lean();
  if (existing) {
    throw new ApiError(
      409,
      "A pending deletion request already exists for this media",
      "CONFLICT",
    );
  }

  const doc = await MediaDeletionRequest.create({
    horseId,
    mediaId,
    requesterUserId,
    status: "pending",
    requestMessage: requestMessage ?? undefined,
    requestedAt: new Date(),
  });

  const ownerIds = await getHorseOwners(horseId);
  const requesterLabel = requesterUserId.slice(-6);
  if (ownerIds.length > 0) {
    createNotification({
      recipientUserIds: ownerIds,
      senderUserId: requesterUserId,
      notificationType: "media_deletion",
      title: "Media deletion requested",
      message: `User ${requesterLabel} requests deletion of media on horse ${horseId.slice(-6)}`,
      horseId,
      actionUrl: `/horses/${horseId}/media`,
      metadata: { mediaDeletionRequestId: String(doc._id), mediaId, status: "pending" },
    }).catch(() => {});
  }

  return toPublic(doc.toObject());
}

export async function approveDeletionRequest(
  actorUserId: string,
  requestId: string,
): Promise<PublicDeletionRequest> {
  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    throw new ApiError(400, "Invalid request id", "VALIDATION_ERROR");
  }

  const request = await MediaDeletionRequest.findById(requestId).lean();
  if (!request) {
    throw new ApiError(404, "Deletion request not found", "NOT_FOUND");
  }
  if (request.status !== "pending") {
    throw new ApiError(400, "Request is no longer pending", "VALIDATION_ERROR");
  }

  const horseId = String(request.horseId);
  const horse = await Horse.findOne({
    _id: horseId,
    ...ownedByUserQuery(actorUserId),
  })
    .select("_id")
    .lean();
  if (!horse) {
    throw new ApiError(403, "Only the horse owner can approve deletion requests", "FORBIDDEN");
  }

  const mediaId = String(request.mediaId);
  await mediaService.deleteMedia(actorUserId, horseId, mediaId);

  await MediaDeletionRequest.findByIdAndUpdate(requestId, {
    status: "approved",
    decisionByUserId: new mongoose.Types.ObjectId(actorUserId),
    respondedAt: new Date(),
    appliedAt: new Date(),
  });

  createNotification({
    recipientUserIds: [String(request.requesterUserId)],
    senderUserId: actorUserId,
    notificationType: "media_deletion",
    title: "Media deletion approved",
    message: "Your request to delete media has been approved and the media has been removed.",
    horseId,
    metadata: { mediaDeletionRequestId: requestId, mediaId, status: "approved" },
  }).catch(() => {});

  const updated = await MediaDeletionRequest.findById(requestId).lean();
  return toPublic(updated ?? request);
}

export async function declineDeletionRequest(
  actorUserId: string,
  requestId: string,
  responseMessage?: string,
): Promise<PublicDeletionRequest> {
  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    throw new ApiError(400, "Invalid request id", "VALIDATION_ERROR");
  }

  const request = await MediaDeletionRequest.findById(requestId).lean();
  if (!request) {
    throw new ApiError(404, "Deletion request not found", "NOT_FOUND");
  }
  if (request.status !== "pending") {
    throw new ApiError(400, "Request is no longer pending", "VALIDATION_ERROR");
  }

  const horseId = String(request.horseId);
  const horse = await Horse.findOne({
    _id: horseId,
    ...ownedByUserQuery(actorUserId),
  })
    .select("_id")
    .lean();
  if (!horse) {
    throw new ApiError(403, "Only the horse owner can decline deletion requests", "FORBIDDEN");
  }

  await MediaDeletionRequest.findByIdAndUpdate(requestId, {
    status: "declined",
    decisionByUserId: new mongoose.Types.ObjectId(actorUserId),
    respondedAt: new Date(),
    responseMessage: responseMessage ?? undefined,
  });

  createNotification({
    recipientUserIds: [String(request.requesterUserId)],
    senderUserId: actorUserId,
    notificationType: "media_deletion",
    title: "Media deletion declined",
    message: responseMessage
      ? `Your request to delete media was declined: ${responseMessage}`
      : "Your request to delete media was declined.",
    horseId,
    metadata: { mediaDeletionRequestId: requestId, mediaId: String(request.mediaId), status: "declined" },
  }).catch(() => {});

  const updated = await MediaDeletionRequest.findById(requestId).lean();
  return toPublic(updated ?? request);
}

export async function cancelDeletionRequest(
  actorUserId: string,
  requestId: string,
): Promise<PublicDeletionRequest> {
  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    throw new ApiError(400, "Invalid request id", "VALIDATION_ERROR");
  }

  const request = await MediaDeletionRequest.findById(requestId).lean();
  if (!request) {
    throw new ApiError(404, "Deletion request not found", "NOT_FOUND");
  }
  if (request.status !== "pending") {
    throw new ApiError(400, "Request is no longer pending", "VALIDATION_ERROR");
  }
  if (String(request.requesterUserId) !== actorUserId) {
    throw new ApiError(403, "Only the requester can cancel their own request", "FORBIDDEN");
  }

  await MediaDeletionRequest.findByIdAndUpdate(requestId, {
    status: "cancelled",
  });

  const updated = await MediaDeletionRequest.findById(requestId).lean();
  return toPublic(updated ?? request);
}

export async function listDeletionRequests(
  actorUserId: string,
  horseId: string,
  status?: string,
): Promise<PublicDeletionRequest[]> {
  if (!mongoose.Types.ObjectId.isValid(horseId)) {
    throw new ApiError(400, "Invalid horse id", "VALIDATION_ERROR");
  }

  const horse = await Horse.findOne({
    _id: horseId,
    ...ownedByUserQuery(actorUserId),
  })
    .select("_id")
    .lean();
  if (!horse) {
    throw new ApiError(403, "Only the horse owner can view deletion requests", "FORBIDDEN");
  }

  const filter: Record<string, unknown> = { horseId };
  if (status) filter.status = status;

  const items = await MediaDeletionRequest.find(filter)
    .sort({ requestedAt: -1 })
    .lean();

  return items.map(toPublic);
}
