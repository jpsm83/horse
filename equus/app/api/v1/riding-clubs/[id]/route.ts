/**
 * Public riding club card route.
 *
 * `GET` `/api/v1/riding-clubs/[id]`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { getAccessTokenFromRequest, verifyAccessToken } from "@/lib/auth/jwt.ts";
import * as ridingClubService from "@/lib/services/ridingClubService.ts";

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
    const ridingClub = await ridingClubService.getPublicRidingClubCard(id, requester);
    return ok({ ridingClub });
  });
}
