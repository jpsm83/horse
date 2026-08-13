/**
 * Stable detail routes.
 *
 * `GET`   `/api/v1/stables/[id]` — role-aware stable view.
 * `PATCH` `/api/v1/stables/[id]` — owner profile update.
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { readOptionalAuthFromRequest, requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import * as stableService from "@/lib/services/stableService.ts";
import { updateStableProfileSchema } from "@/lib/validations/stable.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const { id } = await context.params;
    const requester = await readOptionalAuthFromRequest(request);
    const view = await stableService.getStableView(id, requester.id ?? null);
    return ok(view);
  });
}

/**
 * Owner profile update.
 *
 * `PATCH` `/api/v1/stables/[id]`
 */
export async function PATCH(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const input = updateStableProfileSchema.parse(await request.json());
    const stable = await stableService.updateStableProfile(session.id, id, input);
    return ok({ stable });
  });
}
