/**
 * Public user profile card route.
 *
 * `GET` `/api/v1/users/[id]` — auth optional; visibility enforced by `getPublicUserForRequester`.
 */

import connectDb from "@/lib/db.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { readOptionalAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { getPublicUserForRequester } from "@/lib/privacy/userPublicProfile.ts";
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
    const user = await getPublicUserForRequester(parsedId.data, requester);

    return ok({ user });
  });
}
