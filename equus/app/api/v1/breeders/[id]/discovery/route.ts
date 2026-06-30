/**
 * Breeder discovery visibility updates.
 *
 * `PATCH` `/api/v1/breeders/[id]/discovery`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { updateBreederDiscoverySchema } from "@/lib/validations/breeder.ts";
import * as breederService from "@/lib/services/breederService.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const input = updateBreederDiscoverySchema.parse(await request.json());
    const breeder = await breederService.updateBreederDiscovery(session.id, id, input);
    return ok({ breeder });
  });
}
