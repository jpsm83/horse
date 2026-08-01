/**
 * User hub sections route.
 *
 * `GET` `/api/v1/users/[id]/hub` — auth optional; Layer-1 + Layer-2 visibility
 * enforced by `getUserHub`. Returns `{ sections }` (identity/about/contact/entities).
 */

import connectDb from "@/lib/db.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { readOptionalAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { getUserHub } from "@/lib/privacy/userPublicProfile.ts";
import { userIdParamSchema } from "@/lib/validations/user.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const { id } = await context.params;
    const parsedId = userIdParamSchema.safeParse(id);

    if (!parsedId.success) {
      throw new ApiError(400, "Invalid user id", "VALIDATION_ERROR");
    }

    const requester = await readOptionalAuthFromRequest(request);
    const sections = await getUserHub(parsedId.data, requester);

    return ok({ sections });
  });
}
