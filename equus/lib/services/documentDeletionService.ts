import mongoose from "mongoose";
import Horse from "@/models/Horse.ts";
import Document from "@/models/Document.ts";
import DocumentDeletionRequest from "@/models/DocumentDeletionRequest.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { ownedByUserQuery } from "@/lib/ownership/entityOwnership.ts";
import {
  canDecideDeletionRequest,
  getDeletionDecisionRecipients,
} from "@/lib/ownership/deletionDecisionRecipients.ts";
import * as docService from "@/lib/services/horseDocumentService.ts";
import { createNotification } from "@/lib/services/notificationService.ts";

export type PublicDocumentDeletionRequest = {
  id: string;
  horseId: string;
  documentId: string;
  requesterUserId: string;
  decisionByUserId?: string;
  status: string;
  requestMessage?: string;
  responseMessage?: string;
  requestedAt: string;
  respondedAt?: string;
  appliedAt?: string;
};

function toPublic(record: Record<string, unknown>): PublicDocumentDeletionRequest {
  return {
    id: String(record._id),
    horseId: String(record.horseId),
    documentId: String(record.documentId),
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

const FORBIDDEN_DECIDE =
  "Only a responsible person (or owner if none) can decide deletion requests";

export async function createDeletionRequest(
  requesterUserId: string,
  horseId: string,
  documentId: string,
  requestMessage?: string,
): Promise<PublicDocumentDeletionRequest> {
  if (!mongoose.Types.ObjectId.isValid(documentId)) {
    throw new ApiError(400, "Invalid document id", "VALIDATION_ERROR");
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

  const document = await Document.findOne({ _id: documentId, horseId })
    .select("_id")
    .lean();
  if (!document) {
    throw new ApiError(404, "Document not found", "NOT_FOUND");
  }

  const existing = await DocumentDeletionRequest.findOne({
    documentId,
    status: "pending",
  })
    .select("_id")
    .lean();
  if (existing) {
    throw new ApiError(
      409,
      "A pending deletion request already exists for this document",
      "CONFLICT",
    );
  }

  const doc = await DocumentDeletionRequest.create({
    horseId,
    documentId,
    requesterUserId,
    status: "pending",
    requestMessage: requestMessage ?? undefined,
    requestedAt: new Date(),
  });

  const recipientIds = await getDeletionDecisionRecipients(horseId);
  const requesterLabel = requesterUserId.slice(-6);
  if (recipientIds.length > 0) {
    createNotification({
      recipientUserIds: recipientIds,
      senderUserId: requesterUserId,
      notificationType: "document_deletion",
      title: "Document deletion requested",
      message: `User ${requesterLabel} requests deletion of a document on horse ${horseId.slice(-6)}`,
      horseId,
      actionUrl: `/horses/${horseId}/documents`,
      metadata: {
        documentDeletionRequestId: String(doc._id),
        documentId,
        status: "pending",
      },
    }).catch(() => {});
  }

  return toPublic(doc.toObject());
}

export async function approveDeletionRequest(
  actorUserId: string,
  requestId: string,
): Promise<PublicDocumentDeletionRequest> {
  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    throw new ApiError(400, "Invalid request id", "VALIDATION_ERROR");
  }

  const request = await DocumentDeletionRequest.findById(requestId).lean();
  if (!request) {
    throw new ApiError(404, "Deletion request not found", "NOT_FOUND");
  }
  if (request.status !== "pending") {
    throw new ApiError(400, "Request is no longer pending", "VALIDATION_ERROR");
  }

  const horseId = String(request.horseId);
  if (!(await canDecideDeletionRequest(actorUserId, horseId))) {
    throw new ApiError(403, FORBIDDEN_DECIDE, "FORBIDDEN");
  }

  const documentId = String(request.documentId);
  await docService.deleteHorseDocument(actorUserId, horseId, documentId);

  await DocumentDeletionRequest.findByIdAndUpdate(requestId, {
    status: "approved",
    decisionByUserId: new mongoose.Types.ObjectId(actorUserId),
    respondedAt: new Date(),
    appliedAt: new Date(),
  });

  createNotification({
    recipientUserIds: [String(request.requesterUserId)],
    senderUserId: actorUserId,
    notificationType: "document_deletion",
    title: "Document deletion approved",
    message:
      "Your request to delete a document has been approved and the document has been removed.",
    horseId,
    metadata: { documentDeletionRequestId: requestId, documentId, status: "approved" },
  }).catch(() => {});

  const updated = await DocumentDeletionRequest.findById(requestId).lean();
  return toPublic(updated ?? request);
}

export async function declineDeletionRequest(
  actorUserId: string,
  requestId: string,
  responseMessage?: string,
): Promise<PublicDocumentDeletionRequest> {
  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    throw new ApiError(400, "Invalid request id", "VALIDATION_ERROR");
  }

  const request = await DocumentDeletionRequest.findById(requestId).lean();
  if (!request) {
    throw new ApiError(404, "Deletion request not found", "NOT_FOUND");
  }
  if (request.status !== "pending") {
    throw new ApiError(400, "Request is no longer pending", "VALIDATION_ERROR");
  }

  const horseId = String(request.horseId);
  if (!(await canDecideDeletionRequest(actorUserId, horseId))) {
    throw new ApiError(403, FORBIDDEN_DECIDE, "FORBIDDEN");
  }

  await DocumentDeletionRequest.findByIdAndUpdate(requestId, {
    status: "declined",
    decisionByUserId: new mongoose.Types.ObjectId(actorUserId),
    respondedAt: new Date(),
    responseMessage: responseMessage ?? undefined,
  });

  createNotification({
    recipientUserIds: [String(request.requesterUserId)],
    senderUserId: actorUserId,
    notificationType: "document_deletion",
    title: "Document deletion declined",
    message: responseMessage
      ? `Your request to delete a document was declined: ${responseMessage}`
      : "Your request to delete a document was declined.",
    horseId,
    metadata: {
      documentDeletionRequestId: requestId,
      documentId: String(request.documentId),
      status: "declined",
    },
  }).catch(() => {});

  const updated = await DocumentDeletionRequest.findById(requestId).lean();
  return toPublic(updated ?? request);
}

export async function cancelDeletionRequest(
  actorUserId: string,
  requestId: string,
): Promise<PublicDocumentDeletionRequest> {
  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    throw new ApiError(400, "Invalid request id", "VALIDATION_ERROR");
  }

  const request = await DocumentDeletionRequest.findById(requestId).lean();
  if (!request) {
    throw new ApiError(404, "Deletion request not found", "NOT_FOUND");
  }
  if (request.status !== "pending") {
    throw new ApiError(400, "Request is no longer pending", "VALIDATION_ERROR");
  }
  if (String(request.requesterUserId) !== actorUserId) {
    throw new ApiError(403, "Only the requester can cancel their own request", "FORBIDDEN");
  }

  await DocumentDeletionRequest.findByIdAndUpdate(requestId, {
    status: "cancelled",
  });

  const updated = await DocumentDeletionRequest.findById(requestId).lean();
  return toPublic(updated ?? request);
}

export async function listDeletionRequests(
  actorUserId: string,
  horseId: string,
  status?: string,
): Promise<PublicDocumentDeletionRequest[]> {
  if (!mongoose.Types.ObjectId.isValid(horseId)) {
    throw new ApiError(400, "Invalid horse id", "VALIDATION_ERROR");
  }

  if (!(await canDecideDeletionRequest(actorUserId, horseId))) {
    throw new ApiError(403, FORBIDDEN_DECIDE, "FORBIDDEN");
  }

  const filter: Record<string, unknown> = { horseId };
  if (status) filter.status = status;

  const items = await DocumentDeletionRequest.find(filter)
    .sort({ requestedAt: -1 })
    .lean();

  return items.map(toPublic);
}
