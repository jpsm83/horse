/**
 * Veterinary detail routes.
 *
 * `GET`   `/api/v1/veterinaries/[id]` — role-aware veterinary view.
 * `PATCH` `/api/v1/veterinaries/[id]` — owner profile update.
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { readOptionalAuthFromRequest, requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import * as veterinaryService from "@/lib/services/veterinaryService.ts";
import { updateVeterinaryProfileSchema } from "@/lib/validations/veterinary.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const { id } = await context.params;
    const requester = await readOptionalAuthFromRequest(request);
    const view = await veterinaryService.getVeterinaryView(id, requester.id ?? null);
    return ok(view);
  });
}

/**
 * Owner profile update.
 *
 * `PATCH` `/api/v1/veterinaries/[id]`
 */
export async function PATCH(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const input = updateVeterinaryProfileSchema.parse(await request.json());
    const veterinary = await veterinaryService.updateVeterinaryProfile(session.id, id, input);
    return ok({ veterinary });
  });
}
