/**
 * Trainer discovery visibility updates.
 *
 * `PATCH` `/api/v1/trainers/[id]/discovery`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { updateTrainerDiscoverySchema } from "@/lib/validations/trainer.ts";
import * as trainerService from "@/lib/services/trainerService.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const input = updateTrainerDiscoverySchema.parse(await request.json());
    const trainer = await trainerService.updateTrainerDiscovery(session.id, id, input);
    return ok({ trainer });
  });
}
