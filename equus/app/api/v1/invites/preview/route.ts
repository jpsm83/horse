/**
 * Public invite preview for signup `?ref=` query param.
 *
 * `GET` `/api/v1/invites/preview?ref=`
 */

import connectDb from "@/lib/db.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { resolveInviteRefPreview } from "@/lib/services/invitePreviewService.ts";

export async function GET(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const { searchParams } = new URL(request.url);
    const ref = searchParams.get("ref")?.trim();

    if (!ref) {
      throw new ApiError(400, "Missing ref parameter", "VALIDATION_ERROR");
    }

    const preview = await resolveInviteRefPreview(ref);
    if (!preview) {
      throw new ApiError(404, "Invite not found", "NOT_FOUND");
    }

    return ok({ preview });
  });
}
