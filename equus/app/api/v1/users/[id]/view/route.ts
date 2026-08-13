/**
 * Owner-facing user view route.
 *
 * `GET` `/api/v1/users/[id]/view` — role-aware user view (auth optional; only
 * the owner receives `sections` and other owner-only fields).
 */

import connectDb from "@/lib/db.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { readOptionalAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import * as userService from "@/lib/services/userService.ts";
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
    const view = await userService.getUserView(parsedId.data, requester.id ?? null);
    return ok(view);
  });
}
