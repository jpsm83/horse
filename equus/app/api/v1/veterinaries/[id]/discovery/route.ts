/**
 * Veterinary discovery visibility updates.
 *
 * `PATCH` `/api/v1/veterinaries/[id]/discovery`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { updateVeterinaryDiscoverySchema } from "@/lib/validations/veterinary.ts";
import * as veterinaryService from "@/lib/services/veterinaryService.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const input = updateVeterinaryDiscoverySchema.parse(await request.json());
    const veterinary = await veterinaryService.updateVeterinaryDiscovery(session.id, id, input);
    return ok({ veterinary });
  });
}
