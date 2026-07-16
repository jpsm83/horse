import Document from "@/models/Document.ts";
import { recordAudit } from "@/lib/services/horseAuditService.ts";
import configureCloudinary from "@/lib/cloudinary/cloudinaryConfig.ts";
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

export async function deleteHorseDocument(docId: string, storagePublicId?: string): Promise<void> {
  if (storagePublicId) {
    configureCloudinary();
    await cloudinary.uploader.destroy(storagePublicId).catch(() => {});
  }
  await Document.findByIdAndUpdate(docId, { isActive: false });
}
