/**
 * Breeder detail routes.
 *
 * `GET`   `/api/v1/breeders/[id]` — role-aware breeder view.
 * `PATCH` `/api/v1/breeders/[id]` — owner profile update.
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { readOptionalAuthFromRequest, requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import * as breederService from "@/lib/services/breederService.ts";
import { updateBreederProfileSchema } from "@/lib/validations/breeder.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const { id } = await context.params;
    const requester = await readOptionalAuthFromRequest(request);
    const view = await breederService.getBreederView(id, requester.id ?? null);
    return ok(view);
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
