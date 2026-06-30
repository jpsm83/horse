/**
 * Horse creation route.
 *
 * `POST` `/api/v1/horses`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { createHorseSchema } from "@/lib/validations/horse.ts";
import * as horseService from "@/lib/services/horseService.ts";

export async function POST(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const input = createHorseSchema.parse(await request.json());
    const horse = await horseService.createHorse(session.id, input);
    return ok({ horse }, 201);
  });
}

