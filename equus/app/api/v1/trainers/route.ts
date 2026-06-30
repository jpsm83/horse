/**
 * Trainer profile creation route.
 *
 * `POST` `/api/v1/trainers`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { createTrainerSchema } from "@/lib/validations/trainer.ts";
import * as trainerService from "@/lib/services/trainerService.ts";

export async function POST(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const input = createTrainerSchema.parse(await request.json());
    const trainer = await trainerService.createTrainer(session.id, input);
    return ok({ trainer }, 201);
  });
}
