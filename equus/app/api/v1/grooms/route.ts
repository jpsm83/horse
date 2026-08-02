/**
 * Groom routes — creation and owned-list.
 *
 * `POST` `/api/v1/grooms` — create a groom profile linked to the authenticated user.
 * `GET`  `/api/v1/grooms?mine=true` — list groom profiles owned by the user.
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { createGroomSchema } from "@/lib/validations/groom.ts";
import * as groomService from "@/lib/services/groomService.ts";

export async function POST(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const input = createGroomSchema.parse(await request.json());
    const groom = await groomService.createGroom(session.id, input);
    return ok({ groom }, 201);
  });
}

export async function GET(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const data = await groomService.listGroomsForOwner(session.id);
    return ok(data);
  });
}
