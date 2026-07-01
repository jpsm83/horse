/**
 * Riding club creation route.
 *
 * `POST` `/api/v1/riding-clubs`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { createRidingClubSchema } from "@/lib/validations/ridingClub.ts";
import * as ridingClubService from "@/lib/services/ridingClubService.ts";

export async function POST(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const input = createRidingClubSchema.parse(await request.json());
    const ridingClub = await ridingClubService.createRidingClub(session.id, input);
    return ok({ ridingClub }, 201);
  });
}
