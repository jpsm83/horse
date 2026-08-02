/**
 * Coach routes — creation and owned-list.
 *
 * `POST` `/api/v1/coaches` — create a coach profile for the authenticated user
 *          (returns 409 when the user already has one).
 * `GET`  `/api/v1/coaches` — list coach profiles owned by the user.
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

export async function GET(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const data = await coachService.listCoachesForOwner(session.id);
    return ok(data);
  });
}
