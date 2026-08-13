/**
 * Rider detail routes.
 *
 * `GET`   `/api/v1/riders/[id]` — role-aware rider view.
 * `PATCH` `/api/v1/riders/[id]` — owner profile update.
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { readOptionalAuthFromRequest, requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import * as riderService from "@/lib/services/riderService.ts";
import { updateRiderProfileSchema } from "@/lib/validations/rider.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const { id } = await context.params;
    const requester = await readOptionalAuthFromRequest(request);
    const view = await riderService.getRiderView(id, requester.id ?? null);
    return ok(view);
  });
}

/**
 * Owner profile update.
 *
 * `PATCH` `/api/v1/riders/[id]`
 */
export async function PATCH(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const input = updateRiderProfileSchema.parse(await request.json());
    const rider = await riderService.updateRiderProfile(session.id, id, input);
    return ok({ rider });
  });
}
