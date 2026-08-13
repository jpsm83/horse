/**
 * Trainer detail routes.
 *
 * `GET`   `/api/v1/trainers/[id]` — role-aware trainer view.
 * `PATCH` `/api/v1/trainers/[id]` — owner profile update.
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { readOptionalAuthFromRequest, requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import * as trainerService from "@/lib/services/trainerService.ts";
import { updateTrainerProfileSchema } from "@/lib/validations/trainer.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const { id } = await context.params;
    const requester = await readOptionalAuthFromRequest(request);
    const view = await trainerService.getTrainerView(id, requester.id ?? null);
    return ok(view);
  });
}

/**
 * Owner profile update.
 *
 * `PATCH` `/api/v1/trainers/[id]`
 */
export async function PATCH(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const input = updateTrainerProfileSchema.parse(await request.json());
    const trainer = await trainerService.updateTrainerProfile(session.id, id, input);
    return ok({ trainer });
  });
}
