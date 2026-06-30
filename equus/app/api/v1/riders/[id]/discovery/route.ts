/**
 * Rider discovery visibility updates.
 *
 * `PATCH` `/api/v1/riders/[id]/discovery`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { updateRiderDiscoverySchema } from "@/lib/validations/rider.ts";
import * as riderService from "@/lib/services/riderService.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const input = updateRiderDiscoverySchema.parse(await request.json());
    const rider = await riderService.updateRiderDiscovery(session.id, id, input);
    return ok({ rider });
  });
}
