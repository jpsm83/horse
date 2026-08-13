/**
 * Groom detail routes.
 *
 * `GET`   `/api/v1/grooms/[id]` — role-aware groom view.
 * `PATCH` `/api/v1/grooms/[id]` — owner profile update.
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { readOptionalAuthFromRequest, requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import * as groomService from "@/lib/services/groomService.ts";
import { updateGroomProfileSchema } from "@/lib/validations/groom.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const { id } = await context.params;
    const requester = await readOptionalAuthFromRequest(request);
    const view = await groomService.getGroomView(id, requester.id ?? null);
    return ok(view);
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
