/**
 * PATCH /api/v1/horses/:id/media/:mediaId/visibility — toggle Hub gallery visibility.
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import * as mediaService from "@/lib/services/mediaService.ts";

type RouteContext = { params: Promise<{ id: string; mediaId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id: horseId, mediaId } = await context.params;
    const { isVisibleOnHub } = await request.json();

    if (typeof isVisibleOnHub !== "boolean") {
      throw new ApiError(400, "isVisibleOnHub must be a boolean", "VALIDATION_ERROR");
    }

    const media = await mediaService.updateMediaHubVisibility(
      session.id,
      horseId,
      mediaId,
      isVisibleOnHub,
    );
    return ok({ media });
  });
}
