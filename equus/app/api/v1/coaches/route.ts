/**
 * Coach profile creation route.
 *
 * `POST` `/api/v1/coaches`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { createCoachSchema } from "@/lib/validations/coach.ts";
import * as coachService from "@/lib/services/coachService.ts";

export async function POST(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const input = createCoachSchema.parse(await request.json());
    const coach = await coachService.createCoach(session.id, input);
    return ok({ coach }, 201);
  });
}
