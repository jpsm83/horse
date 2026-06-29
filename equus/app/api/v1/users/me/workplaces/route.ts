/**
 * User workplaces — owned business profiles and collaborations (including pending invites).
 *
 * `GET` `/api/v1/users/me/workplaces`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import * as workplaceRelationshipService from "@/lib/services/workplaceRelationshipService.ts";

export async function GET(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);

    const workplaces = await workplaceRelationshipService.listWorkplacesForUser(session.id);

    return ok({ workplaces });
  });
}
