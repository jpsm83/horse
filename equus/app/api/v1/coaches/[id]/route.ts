/**
 * Coach detail routes.
 *
 * `GET`   `/api/v1/coaches/[id]` — public coach card filtered by `isPublic`
 *          and requester context.
 * `PATCH` `/api/v1/coaches/[id]` — owner profile update.
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { getAccessTokenFromRequest, verifyAccessToken } from "@/lib/auth/jwt.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import * as coachService from "@/lib/services/coachService.ts";
import { updateCoachProfileSchema } from "@/lib/validations/coach.ts";

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
    const coach = await coachService.getPublicCoachCard(id, requester);
    return ok({ coach });
  });
}

/**
 * Owner profile update.
 *
 * `PATCH` `/api/v1/coaches/[id]`
 */
export async function PATCH(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const input = updateCoachProfileSchema.parse(await request.json());
    const coach = await coachService.updateCoachProfile(session.id, id, input);
    return ok({ coach });
  });
}
