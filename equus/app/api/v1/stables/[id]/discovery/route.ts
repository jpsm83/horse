/**
 * Stable discovery visibility updates.
 *
 * `PATCH` `/api/v1/stables/[id]/discovery`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { updateStableDiscoverySchema } from "@/lib/validations/stable.ts";
import * as stableService from "@/lib/services/stableService.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const input = updateStableDiscoverySchema.parse(await request.json());
    const stable = await stableService.updateStableDiscovery(session.id, id, input);
    return ok({ stable });
  });
}
