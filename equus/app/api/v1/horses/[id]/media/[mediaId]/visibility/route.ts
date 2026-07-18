import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import HorseMedia from "@/models/HorseMedia.ts";
import * as mediaService from "@/lib/services/horseMediaService.ts";

type RouteContext = { params: Promise<{ mediaId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    await requireAuthFromRequest(request);
    const { mediaId } = await context.params;
    const { isVisibleOnHub } = await request.json();

    if (typeof isVisibleOnHub !== "boolean") {
      throw new ApiError(400, "isVisibleOnHub must be a boolean", "VALIDATION_ERROR");
    }

    const record = await HorseMedia.findByIdAndUpdate(
      mediaId,
      { isVisibleOnHub },
      { new: true },
    ).lean();

    if (!record) {
      throw new ApiError(404, "Media not found", "NOT_FOUND");
    }

    const media = {
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

    return ok({ media });
  });
}
