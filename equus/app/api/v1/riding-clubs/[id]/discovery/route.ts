/**
 * Riding club discovery visibility updates.
 *
 * `PATCH` `/api/v1/riding-clubs/[id]/discovery`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { updateRidingClubDiscoverySchema } from "@/lib/validations/ridingClub.ts";
import * as ridingClubService from "@/lib/services/ridingClubService.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const input = updateRidingClubDiscoverySchema.parse(await request.json());
    const ridingClub = await ridingClubService.updateRidingClubDiscovery(session.id, id, input);
    return ok({ ridingClub });
  });
}
