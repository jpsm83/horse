/**
 * Rider routes — creation and owned-list.
 *
 * `POST` `/api/v1/riders` — create a rider profile for the authenticated user
 *          (returns 409 when the user already has one).
 * `GET`  `/api/v1/riders` — list rider profiles owned by the user.
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { createRiderSchema } from "@/lib/validations/rider.ts";
import * as riderService from "@/lib/services/riderService.ts";

export async function POST(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const input = createRiderSchema.parse(await request.json());
    const rider = await riderService.createRider(session.id, input);
    return ok({ rider }, 201);
  });
}

export async function GET(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const data = await riderService.listRidersForOwner(session.id);
    return ok(data);
  });
}
