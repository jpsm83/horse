import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import * as mediaService from "@/lib/services/mediaService.ts";

type RouteContext = { params: Promise<{ id: string; mediaId: string }> };

export async function DELETE(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id: horseId, mediaId } = await context.params;

    await mediaService.deleteMedia(session.id, horseId, mediaId);
    return ok({ deleted: true });
  });
}
