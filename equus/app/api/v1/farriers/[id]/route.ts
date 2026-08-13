/**
 * Farrier detail routes.
 *
 * `GET`   `/api/v1/farriers/[id]` — role-aware farrier view.
 * `PATCH` `/api/v1/farriers/[id]` — owner profile update.
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { readOptionalAuthFromRequest, requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import * as farrierService from "@/lib/services/farrierService.ts";
import { updateFarrierProfileSchema } from "@/lib/validations/farrier.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const { id } = await context.params;
    const requester = await readOptionalAuthFromRequest(request);
    const view = await farrierService.getFarrierView(id, requester.id ?? null);
    return ok(view);
  });
}

/**
 * Owner profile update.
 *
 * `PATCH` `/api/v1/farriers/[id]`
 */
export async function PATCH(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const input = updateFarrierProfileSchema.parse(await request.json());
    const farrier = await farrierService.updateFarrierProfile(session.id, id, input);
    return ok({ farrier });
  });
}
