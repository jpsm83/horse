import HorseMedia from "@/models/HorseMedia.ts";

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
  return toPublic(item.toObject());
}
