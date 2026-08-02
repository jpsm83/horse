/**
 * Farrier detail routes — public card read and owner profile update.
 *
 * `GET`   `/api/v1/farriers/[id]`
 * `PATCH` `/api/v1/farriers/[id]`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { getAccessTokenFromRequest, verifyAccessToken } from "@/lib/auth/jwt.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import * as farrierService from "@/lib/services/farrierService.ts";
import { updateFarrierProfileSchema } from "@/lib/validations/farrier.ts";

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
    const farrier = await farrierService.getPublicFarrierCard(id, requester);
    return ok({ farrier });
  });
}

/**
 * Owner profile update.
 *
 * `PATCH` `/api/v1/farriers/[id]`
 */
export async function PATCH(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const input = updateFarrierProfileSchema.parse(await request.json());
    const farrier = await farrierService.updateFarrierProfile(session.id, id, input);
    return ok({ farrier });
  });
}
