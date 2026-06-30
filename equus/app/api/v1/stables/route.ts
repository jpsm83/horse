/**
 * Stable creation route.
 *
 * `POST` `/api/v1/stables`
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
