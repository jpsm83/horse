import mongoose from "mongoose";
import Document from "@/models/Document.ts";
import Horse from "@/models/Horse.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { ownedByUserQuery } from "@/lib/ownership/entityOwnership.ts";
import { recordAudit } from "@/lib/services/horseAuditService.ts";
import configureCloudinary from "@/lib/cloudinary/cloudinaryConfig.ts";
import { buildDocumentDownloadUrls } from "@/lib/cloudinary/documentDelivery.ts";
import { cloudinaryResourceTypeFromMime } from "@/lib/cloudinary/resourceTypeFromMime.ts";
import { v2 as cloudinary } from "cloudinary";

export type PublicHorseDocument = {
  id: string;
  horseId: string;
  documentType: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  mimeType?: string;
  fileSizeBytes?: number;
  storagePublicId?: string;
  visibility: string;
  uploadedByName: string;
  createdAt: string;
};

function toPublic(record: Record<string, unknown>): PublicHorseDocument {
  const uploader = record.uploadedByUserId as Record<string, unknown> | undefined;
  const firstName = (uploader?.firstName as string) ?? "";
  const lastName = (uploader?.lastName as string) ?? "";
  const uploadedByName = [firstName, lastName].filter(Boolean).join(" ") || "Unknown";

  return {
    id: String(record._id),
    horseId: String(record.horseId),
    documentType: record.documentType as string,
    title: record.title as string,
    description: record.description as string | undefined,
    fileUrl: record.fileUrl as string,
    fileName: record.fileName as string,
    mimeType: record.mimeType as string | undefined,
    fileSizeBytes: record.fileSizeBytes as number | undefined,
    storagePublicId: record.storagePublicId as string | undefined,
    visibility: record.visibility as string,
    uploadedByName,
    createdAt: (record.createdAt as Date).toISOString(),
  };
}

export async function listHorseDocuments(horseId: string): Promise<PublicHorseDocument[]> {
  const docs = await Document.find({ horseId, isActive: true })
    .populate("uploadedByUserId", "firstName lastName")
    .sort({ createdAt: -1 })
    .lean();
  return docs.map(toPublic);
}

export async function createHorseDocument(
  userId: string,
  horseId: string,
  input: Record<string, unknown>,
): Promise<PublicHorseDocument> {
  const doc = await Document.create({
    ...input,
    horseId,
    uploadedByUserId: userId,
  });
  recordAudit({
    horseId,
    actorId: userId,
    actionType: "document.created",
    description: `Document "${input.title}" added`,
  }).catch(() => {});
  return toPublic(doc.toObject());
}

export type HorseDocumentDownloadMeta = {
  fileName: string;
  mimeType?: string;
  downloadUrls: string[];
};

/**
 * Resolves download metadata for a horse document after ownership checks.
 * Same access rule as delete: main owner, co-owner, or responsible.
 */
export async function getHorseDocumentDownloadMeta(
  actorUserId: string,
  horseId: string,
  docId: string,
): Promise<HorseDocumentDownloadMeta> {
  if (!mongoose.Types.ObjectId.isValid(docId)) {
    throw new ApiError(400, "Invalid document id", "VALIDATION_ERROR");
  }
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
    throw new ApiError(404, "Horse not found", "NOT_FOUND");
  }

  const record = await Document.findOne({ _id: docId, horseId, isActive: true })
    .select("storagePublicId fileUrl fileName mimeType")
    .lean();
  if (!record) {
    throw new ApiError(404, "Document not found", "NOT_FOUND");
  }

  return {
    fileName: record.fileName as string,
    mimeType: record.mimeType as string | undefined,
    downloadUrls: buildDocumentDownloadUrls({
      storagePublicId: record.storagePublicId as string | undefined,
      fileUrl: record.fileUrl as string,
      fileName: record.fileName as string,
      mimeType: record.mimeType as string | undefined,
    }),
  };
}

/**
 * Hard-delete a horse document and its Cloudinary asset (Media-style exception).
 * Only main owner, co-owner, or responsible may call this.
 */
export async function deleteHorseDocument(
  actorUserId: string,
  horseId: string,
  docId: string,
): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(docId)) {
    throw new ApiError(400, "Invalid document id", "VALIDATION_ERROR");
  }
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
    throw new ApiError(404, "Horse not found", "NOT_FOUND");
  }

  const record = await Document.findOne({ _id: docId, horseId })
    .select("storagePublicId mimeType title")
    .lean();
  if (!record) {
    throw new ApiError(404, "Document not found", "NOT_FOUND");
  }

  const storagePublicId = record.storagePublicId as string | undefined;
  if (storagePublicId) {
    configureCloudinary();
    const resourceType = cloudinaryResourceTypeFromMime(record.mimeType as string | undefined);
    const result = await cloudinary.uploader.destroy(storagePublicId, {
      resource_type: resourceType,
    });
    if (result.result !== "ok") {
      console.error(
        `[horseDocumentService.deleteHorseDocument] Cloudinary destroy returned "${result.result}" for public_id: ${storagePublicId} (resource_type: ${resourceType})`,
      );
    }
  }

  await Document.findByIdAndDelete(docId);

  recordAudit({
    horseId,
    actorId: actorUserId,
    actionType: "document.deleted",
    description: `Document "${(record.title as string) ?? "untitled"}" deleted`,
  }).catch(() => {});
}
