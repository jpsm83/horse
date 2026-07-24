/**
 * GET /api/v1/horses/[id]/hub — filtered Hub DTO (Layer 1 + Layer 2).
 *
 * Auth optional. Layer 1 fail → 404. Only allowed sections are present in `sections`.
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
    const hub = await horseService.getHorseHub(id, requester);
    return ok({ hub });
  });
}
