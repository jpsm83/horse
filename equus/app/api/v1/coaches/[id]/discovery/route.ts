/**
 * Coach discovery visibility updates.
 *
 * `PATCH` `/api/v1/coaches/[id]/discovery`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { updateCoachDiscoverySchema } from "@/lib/validations/coach.ts";
import * as coachService from "@/lib/services/coachService.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const input = updateCoachDiscoverySchema.parse(await request.json());
    const coach = await coachService.updateCoachDiscovery(session.id, id, input);
    return ok({ coach });
  });
}
