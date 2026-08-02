/**
 * Riding club routes — creation and owned-list.
 *
 * `POST` `/api/v1/riding-clubs` — create a riding club owned by the user.
 * `GET`  `/api/v1/riding-clubs?mine=true` — list riding clubs owned by the user.
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

export async function GET(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const limit = Number(url.searchParams.get("limit") ?? 20);
    const data = await ridingClubService.listRidingClubsForOwner(session.id, page, limit);
    return ok(data);
  });
}
