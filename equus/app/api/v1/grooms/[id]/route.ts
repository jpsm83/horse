/**
 * Groom detail routes — public card read and owner profile update.
 *
 * `GET`   `/api/v1/grooms/[id]`
 * `PATCH` `/api/v1/grooms/[id]`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { getAccessTokenFromRequest, verifyAccessToken } from "@/lib/auth/jwt.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import * as groomService from "@/lib/services/groomService.ts";
import { updateGroomProfileSchema } from "@/lib/validations/groom.ts";

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
    const groom = await groomService.getPublicGroomCard(id, requester);
    return ok({ groom });
  });
}

/**
 * Owner profile update.
 *
 * `PATCH` `/api/v1/grooms/[id]`
 */
export async function PATCH(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const input = updateGroomProfileSchema.parse(await request.json());
    const groom = await groomService.updateGroomProfile(session.id, id, input);
    return ok({ groom });
  });
}
