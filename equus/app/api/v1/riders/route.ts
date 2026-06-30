/**
 * Rider profile creation route.
 *
 * `POST` `/api/v1/riders`
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
