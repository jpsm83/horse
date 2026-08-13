/**
 * Owner-facing user view route.
 *
 * `GET` `/api/v1/users/[id]/view` — owner hub view for `/user/:id` (auth required;
 * only the account owner may access this route).
 */

import connectDb from "@/lib/db.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
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

    const session = await requireAuthFromRequest(request);
    if (session.id !== parsedId.data) {
      throw new ApiError(403, "You can only view your own account hub", "FORBIDDEN");
    }

    const view = await userService.getUserView(parsedId.data, session.id);
    return ok(view);
  });
}
