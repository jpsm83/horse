/**
 * Farrier discovery visibility updates.
 *
 * `PATCH` `/api/v1/farriers/[id]/discovery`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { updateFarrierDiscoverySchema } from "@/lib/validations/farrier.ts";
import * as farrierService from "@/lib/services/farrierService.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const input = updateFarrierDiscoverySchema.parse(await request.json());
    const farrier = await farrierService.updateFarrierDiscovery(session.id, id, input);
    return ok({ farrier });
  });
}
