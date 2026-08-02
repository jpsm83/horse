/**
 * Public breeder card route + owner profile update.
 *
 * `GET`   `/api/v1/breeders/[id]`
 * `PATCH` `/api/v1/breeders/[id]`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { getAccessTokenFromRequest, verifyAccessToken } from "@/lib/auth/jwt.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import * as breederService from "@/lib/services/breederService.ts";
import { updateBreederProfileSchema } from "@/lib/validations/breeder.ts";

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
    const breeder = await breederService.getPublicBreederCard(id, requester);
    return ok({ breeder });
  });
}

/**
 * Owner profile update.
 *
 * `PATCH` `/api/v1/breeders/[id]`
 */
export async function PATCH(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const input = updateBreederProfileSchema.parse(await request.json());
    const breeder = await breederService.updateBreederProfile(session.id, id, input);
    return ok({ breeder });
  });
}
