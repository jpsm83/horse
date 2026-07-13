import Document from "@/models/Document.ts";
import { recordAudit } from "@/lib/services/horseAuditService.ts";

export type PublicHorseDocument = {
  id: string;
  horseId: string;
  documentType: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  visibility: string;
  createdAt: string;
};

function toPublic(record: Record<string, unknown>): PublicHorseDocument {
  return {
    id: String(record._id),
    horseId: String(record.horseId),
    documentType: record.documentType as string,
    title: record.title as string,
    description: record.description as string | undefined,
    fileUrl: record.fileUrl as string,
    fileName: record.fileName as string,
    visibility: record.visibility as string,
    createdAt: (record.createdAt as Date).toISOString(),
  };
}

export async function listHorseDocuments(horseId: string): Promise<PublicHorseDocument[]> {
  const docs = await Document.find({ horseId, isActive: true })
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
