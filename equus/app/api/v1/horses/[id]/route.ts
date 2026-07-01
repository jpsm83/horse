/**
 * Public horse card route.
 *
 * `GET` `/api/v1/horses/[id]`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { readOptionalAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import * as horseService from "@/lib/services/horseService.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const { id } = await context.params;
    const requester = await readOptionalAuthFromRequest(request);
    const horse = await horseService.getPublicHorseCard(id, requester);
    return ok({ horse });
  });
}

