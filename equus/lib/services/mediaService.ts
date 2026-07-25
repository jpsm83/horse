import mongoose from "mongoose";
import Media from "@/models/Media.ts";
import Horse from "@/models/Horse.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { ownedByUserQuery } from "@/lib/ownership/entityOwnership.ts";
import {
  assertCanViewHorseGlobal,
  canAccessByItemVisibilityMode,
  canViewHorseHubSection,
  resolveHorseViewerAudience,
} from "@/lib/horses/horseVisibilityAccess.ts";
import { assertPublicReadAllowed } from "@/lib/lifecycle/activeQuery.ts";
import { recordAudit } from "@/lib/services/horseAuditService.ts";
import configureCloudinary from "@/lib/cloudinary/cloudinaryConfig.ts";
import { v2 as cloudinary } from "cloudinary";

export type PublicMedia = {
  id: string;
  horseId: string;
  type: string;
  url: string;
  thumbnailUrl?: string;
  title?: string;
  description?: string;
  storagePublicId?: string;
  isVisibleOnHub: boolean;
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
    description: record.description as string | undefined,
    storagePublicId: record.storagePublicId as string | undefined,
    isVisibleOnHub: record.isVisibleOnHub !== false,
    visibilityMode: record.visibilityMode as string,
    createdAt: (record.createdAt as Date).toISOString(),
  };
}

/**
 * List media for a horse.
 * Layer 1 deny → 404. Owner team → full list. Others: Layer 2 gallery, then item modes.
 */
export async function listMedia(
  horseId: string,
  requester?: { id?: string; isAuthenticated?: boolean },
): Promise<PublicMedia[]> {
  if (!mongoose.Types.ObjectId.isValid(horseId)) {
    throw new ApiError(400, "Invalid horse id", "VALIDATION_ERROR");
  }

  const horse = await Horse.findById(horseId).lean();
  if (!horse) {
    throw new ApiError(404, "Horse not found", "NOT_FOUND");
  }

  const horseDoc = horse as Record<string, unknown>;
  await assertPublicReadAllowed(horseDoc, "Horse");

  const audience = await resolveHorseViewerAudience(horseDoc, requester?.id);
  assertCanViewHorseGlobal(horseDoc, audience);

  const items = await Media.find({ horseId, isActive: true })
    .sort({ createdAt: -1 })
    .lean();

  if (audience.isOwnerTeam) {
    return items.map((item) => toPublic(item as Record<string, unknown>));
  }

  if (!canViewHorseHubSection(horseDoc, "gallery", audience)) {
    return [];
  }

  return items
    .filter((item) => {
      const record = item as Record<string, unknown>;
      return canAccessByItemVisibilityMode(
        record.visibilityMode as string | undefined,
        audience,
      );
    })
    .map((item) => toPublic(item as Record<string, unknown>));
}

export async function createMedia(
  userId: string,
  horseId: string,
  input: Record<string, unknown>,
): Promise<PublicMedia> {
  const item = await Media.create({
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

export async function deleteMedia(
  actorUserId: string,
  horseId: string,
  mediaId: string,
): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(mediaId)) {
    throw new ApiError(400, "Invalid media id", "VALIDATION_ERROR");
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

  const record = await Media.findOne({ _id: mediaId, horseId })
    .select("storagePublicId type title")
    .lean();
  if (!record) {
    throw new ApiError(404, "Media not found", "NOT_FOUND");
  }

  if (record.storagePublicId) {
    configureCloudinary();
    const resourceType = record.type === "video" ? "video" : "image";
    const result = await cloudinary.uploader.destroy(
      record.storagePublicId as string,
      { resource_type: resourceType },
    );
    if (result.result !== "ok") {
      console.error(
        `[mediaService.deleteMedia] Cloudinary destroy returned "${result.result}" for public_id: ${record.storagePublicId}`,
      );
    }
  }

  await Media.findByIdAndDelete(mediaId);

  recordAudit({
    horseId,
    actorId: actorUserId,
    actionType: "media.deleted",
    description: `Media "${record.title ?? "untitled"}" deleted`,
  }).catch(() => {});
}
