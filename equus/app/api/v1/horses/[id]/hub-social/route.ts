/**
 * Horse Hub social lists (guest-safe).
 *
 * `GET` `/api/v1/horses/[id]/hub-social` — gallery / planning / connections
 * filtered by L1+L2. Auth optional. Not part of the shared horse view chrome.
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
    const data = await horseService.getHorseHubSocial(id, requester.id ?? null);
    return ok(data);
  });
}
