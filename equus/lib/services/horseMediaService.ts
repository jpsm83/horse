import HorseMedia from "@/models/HorseMedia.ts";
import { recordAudit } from "@/lib/services/horseAuditService.ts";
import configureCloudinary from "@/lib/cloudinary/cloudinaryConfig.ts";
import { v2 as cloudinary } from "cloudinary";
import { CLOUDINARY_UPLOAD_PRESET } from "@/lib/cloudinary/constants.ts";

export type PublicMedia = {
  id: string;
  horseId: string;
  type: string;
  url: string;
  thumbnailUrl?: string;
  title?: string;
  visibilityMode: string;
  createdAt: string;
};

function toPublic(record: Record<string, unknown>): PublicMedia {
  return {
    id: String(record._id),
    horseId: String(record.horseId),
    type: record.type as string,
    url: record.url as string,
    thumbnailUrl: record.thumbnailUrl as string | undefined,
    title: record.title as string | undefined,
    visibilityMode: record.visibilityMode as string,
    createdAt: (record.createdAt as Date).toISOString(),
  };
}

export async function listMedia(horseId: string): Promise<PublicMedia[]> {
  const items = await HorseMedia.find({ horseId, isActive: true })
    .sort({ createdAt: -1 })
    .lean();
  return items.map(toPublic);
}

export async function createMedia(
  userId: string,
  horseId: string,
  input: Record<string, unknown>,
): Promise<PublicMedia> {
  const item = await HorseMedia.create({
    ...input,
    horseId,
    uploadedByUserId: userId,
  });
  recordAudit({
    horseId,
    actorId: userId,
    actionType: "media.created",
    description: `Media "${input.title ?? "untitled"}" added`,
  }).catch(() => {});
  return toPublic(item.toObject());
}

export function extractStoragePublicId(url: string): string | null {
  const pattern = new RegExp(`${CLOUDINARY_UPLOAD_PRESET}\\/[^.]+`);
  const match = url.match(pattern);
  return match ? match[0] : null;
}

export async function deleteMedia(
  mediaId: string,
  storagePublicId?: string | null,
): Promise<void> {
  if (storagePublicId) {
    configureCloudinary();
    await cloudinary.uploader
      .destroy(storagePublicId, { resource_type: "auto" })
      .catch(() => {});
  }
  await HorseMedia.findByIdAndUpdate(mediaId, { isActive: false });
}
