/**
 * Pending relationships for the authenticated user.
 *
 * `GET` `/api/v1/users/me/relationships?status=pending`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { listRelationshipsQuerySchema } from "@/lib/validations/relationship.ts";
import * as relationshipService from "@/lib/services/relationshipService.ts";

export async function GET(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { searchParams } = new URL(request.url);
    const query = listRelationshipsQuerySchema.parse({
      status: searchParams.get("status") ?? undefined,
    });

    if (query.status && query.status !== "pending") {
      return ok({ relationships: [] });
    }

    const relationships = await relationshipService.listPendingForUser(
      session.id,
      session.email,
    );

    return ok({ relationships });
  });
}
