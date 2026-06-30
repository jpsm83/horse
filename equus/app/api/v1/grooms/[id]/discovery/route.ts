/**
 * Groom discovery visibility updates.
 *
 * `PATCH` `/api/v1/grooms/[id]/discovery`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { updateGroomDiscoverySchema } from "@/lib/validations/groom.ts";
import * as groomService from "@/lib/services/groomService.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const input = updateGroomDiscoverySchema.parse(await request.json());
    const groom = await groomService.updateGroomDiscovery(session.id, id, input);
    return ok({ groom });
  });
}
