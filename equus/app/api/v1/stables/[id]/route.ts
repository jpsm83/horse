/**
 * Public stable card route.
 *
 * `GET` `/api/v1/stables/[id]`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { getAccessTokenFromRequest, verifyAccessToken } from "@/lib/auth/jwt.ts";
import * as stableService from "@/lib/services/stableService.ts";

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
    const stable = await stableService.getPublicStableCard(id, requester);
    return ok({ stable });
  });
}
