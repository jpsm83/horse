/**
 * Coach detail routes.
 *
 * `GET`   `/api/v1/coaches/[id]` — role-aware coach view.
 * `PATCH` `/api/v1/coaches/[id]` — owner profile update.
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { readOptionalAuthFromRequest, requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import * as coachService from "@/lib/services/coachService.ts";
import { updateCoachProfileSchema } from "@/lib/validations/coach.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const { id } = await context.params;
    const requester = await readOptionalAuthFromRequest(request);
    const view = await coachService.getCoachView(id, requester.id ?? null);
    return ok(view);
  });
}

/**
 * Owner profile update.
 *
 * `PATCH` `/api/v1/coaches/[id]`
 */
export async function PATCH(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const input = updateCoachProfileSchema.parse(await request.json());
    const coach = await coachService.updateCoachProfile(session.id, id, input);
    return ok({ coach });
  });
}
