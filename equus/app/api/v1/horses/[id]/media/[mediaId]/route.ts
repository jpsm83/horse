import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import HorseMedia from "@/models/HorseMedia.ts";
import * as mediaService from "@/lib/services/horseMediaService.ts";

type RouteContext = { params: Promise<{ mediaId: string }> };

export async function DELETE(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    await requireAuthFromRequest(request);
    const { mediaId } = await context.params;

    const record = await HorseMedia.findById(mediaId).lean();
    if (!record) {
      throw new ApiError(404, "Media not found", "NOT_FOUND");
    }

    await mediaService.deleteMedia(
      mediaId,
      record.url as string,
      record.thumbnailUrl as string | undefined,
    );
    return ok({ deleted: true });
  });
}
