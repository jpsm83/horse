/**
 * Trainer card + owner profile routes.
 *
 * `GET`   `/api/v1/trainers/[id]` — public trainer card.
 * `PATCH` `/api/v1/trainers/[id]` — owner profile update.
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { getAccessTokenFromRequest, verifyAccessToken } from "@/lib/auth/jwt.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import * as trainerService from "@/lib/services/trainerService.ts";
import { updateTrainerProfileSchema } from "@/lib/validations/trainer.ts";

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
    const trainer = await trainerService.getPublicTrainerCard(id, requester);
    return ok({ trainer });
  });
}

/**
 * Owner profile update.
 *
 * `PATCH` `/api/v1/trainers/[id]`
 */
export async function PATCH(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const input = updateTrainerProfileSchema.parse(await request.json());
    const trainer = await trainerService.updateTrainerProfile(session.id, id, input);
    return ok({ trainer });
  });
}
