import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import * as mediaService from "@/lib/services/horseMediaService.ts";

type RouteContext = { params: Promise<{ mediaId: string }> };

export async function DELETE(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    await requireAuthFromRequest(request);
    const { mediaId } = await context.params;
    const { storagePublicId } = await request.json().catch(() => ({}));
    await mediaService.deleteMedia(mediaId, storagePublicId);
    return ok({ deleted: true });
  });
}
