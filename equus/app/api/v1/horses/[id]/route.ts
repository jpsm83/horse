/**
 * Horse detail routes.
 *
 * `GET`   `/api/v1/horses/[id]`  — role-aware horse view (replaces /owner and /hub)
 * `PATCH` `/api/v1/horses/[id]`  — update profile (owner/co-owner only)
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { readOptionalAuthFromRequest, requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import * as horseService from "@/lib/services/horseService.ts";
import { updateHorseProfileSchema } from "@/lib/validations/horse.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const { id } = await context.params;
    const requester = await readOptionalAuthFromRequest(request);
    const view = await horseService.getHorseView(id, requester.id ?? null);
    return ok(view);
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const input = updateHorseProfileSchema.parse(await request.json());
    const horse = await horseService.updateHorseProfile(session.id, id, input);
    return ok({ horse });
  });
}
