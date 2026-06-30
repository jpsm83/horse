/**
 * Transport discovery visibility updates.
 *
 * `PATCH` `/api/v1/transports/[id]/discovery`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { updateTransportDiscoverySchema } from "@/lib/validations/transport.ts";
import * as transportService from "@/lib/services/transportService.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const input = updateTransportDiscoverySchema.parse(await request.json());
    const transport = await transportService.updateTransportDiscovery(session.id, id, input);
    return ok({ transport });
  });
}
