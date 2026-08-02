/**
 * Public transport card route.
 *
 * `GET` `/api/v1/transports/[id]`
 * `PATCH` `/api/v1/transports/[id]` — owner profile update.
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { getAccessTokenFromRequest, verifyAccessToken } from "@/lib/auth/jwt.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import * as transportService from "@/lib/services/transportService.ts";
import { updateTransportProfileSchema } from "@/lib/validations/transport.ts";

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
    const transport = await transportService.getPublicTransportCard(id, requester);
    return ok({ transport });
  });
}

/**
 * Owner profile update.
 *
 * `PATCH` `/api/v1/transports/[id]`
 */
export async function PATCH(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const input = updateTransportProfileSchema.parse(await request.json());
    const transport = await transportService.updateTransportProfile(session.id, id, input);
    return ok({ transport });
  });
}
