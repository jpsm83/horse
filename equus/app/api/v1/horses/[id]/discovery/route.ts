/**
 * Horse discovery visibility/contact updates.
 *
 * `PATCH` `/api/v1/horses/[id]/discovery`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { updateHorseDiscoverySchema } from "@/lib/validations/horse.ts";
import * as horseService from "@/lib/services/horseService.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const input = updateHorseDiscoverySchema.parse(await request.json());
    const horse = await horseService.updateHorseDiscovery(session.id, id, input);
    return ok({ horse });
  });
}

