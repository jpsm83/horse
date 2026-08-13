/**
 * Transport detail routes.
 *
 * `GET`   `/api/v1/transports/[id]` — role-aware transport view.
 * `PATCH` `/api/v1/transports/[id]` — owner profile update.
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { readOptionalAuthFromRequest, requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import * as transportService from "@/lib/services/transportService.ts";
import { updateTransportProfileSchema } from "@/lib/validations/transport.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const { id } = await context.params;
    const requester = await readOptionalAuthFromRequest(request);
    const view = await transportService.getTransportView(id, requester.id ?? null);
    return ok(view);
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
