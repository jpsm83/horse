/**
 * Rider detail routes.
 *
 * `GET`   `/api/v1/riders/[id]` — public rider card filtered by `isPublic`
 *          and requester context.
 * `PATCH` `/api/v1/riders/[id]` — owner profile update.
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { getAccessTokenFromRequest, verifyAccessToken } from "@/lib/auth/jwt.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import * as riderService from "@/lib/services/riderService.ts";
import { updateRiderProfileSchema } from "@/lib/validations/rider.ts";

type RouteContext = { params: Promise<{ id: string }> };

async function readOptionalSession(
  request: Request,
): Promise<{ id?: string; isAuthenticated: boolean }> {
  const token = getAccessTokenFromRequest(request);
  if (!token) {
    return { isAuthenticated: false };
  }

  try {
    const session = await verifyAccessToken(token);
    return { id: session.id, isAuthenticated: true };
  } catch {
    return { isAuthenticated: false };
  }
}

export async function GET(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const { id } = await context.params;
    const requester = await readOptionalSession(request);
    const rider = await riderService.getPublicRiderCard(id, requester);
    return ok({ rider });
  });
}

/**
 * Owner profile update.
 *
 * `PATCH` `/api/v1/riders/[id]`
 */
export async function PATCH(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const input = updateRiderProfileSchema.parse(await request.json());
    const rider = await riderService.updateRiderProfile(session.id, id, input);
    return ok({ rider });
  });
}
