/**
 * Trainer profile routes — creation and owned-list.
 *
 * `POST` `/api/v1/trainers` — create a trainer profile for the authenticated
 *   user (409 when the user already has one).
 * `GET`  `/api/v1/trainers` — list the trainer profile(s) owned by the user
 *   (user-linked roles hold at most one, so this returns a single entry or none).
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

export async function GET(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const data = await trainerService.listTrainersForOwner(session.id);
    return ok(data);
  });
}
