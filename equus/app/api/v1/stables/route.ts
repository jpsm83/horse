/**
 * Stable routes — creation and owned-list.
 *
 * `POST` `/api/v1/stables` — create a stable owned by the authenticated user.
 * `GET`  `/api/v1/stables?mine=true` — list stables owned by the user.
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { createStableSchema } from "@/lib/validations/stable.ts";
import * as stableService from "@/lib/services/stableService.ts";

export async function POST(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const input = createStableSchema.parse(await request.json());
    const stable = await stableService.createStable(session.id, input);
    return ok({ stable }, 201);
  });
}

export async function GET(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const limit = Number(url.searchParams.get("limit") ?? 20);
    const data = await stableService.listStablesForOwner(session.id, page, limit);
    return ok(data);
  });
}
