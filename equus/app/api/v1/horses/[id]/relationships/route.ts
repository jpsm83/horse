/**
 * Outbound pending relationship invites for a horse the user owns.
 *
 * `GET` `/api/v1/horses/[id]/relationships?status=pending`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { listRelationshipsQuerySchema } from "@/lib/validations/relationship.ts";
import * as relationshipService from "@/lib/services/relationshipService.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const query = listRelationshipsQuerySchema.parse({
      status: searchParams.get("status") ?? undefined,
    });

    if (query.status && query.status !== "pending") {
      return ok({ relationships: [] });
    }

    const relationships = await relationshipService.listPendingSentForHorse(session.id, id);

    return ok({ relationships });
  });
}
