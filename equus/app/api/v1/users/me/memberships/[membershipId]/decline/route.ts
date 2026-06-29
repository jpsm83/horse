/**
 * Legacy decline route — delegates to workplaceRelationshipService (prefer workplace-invitations).
 *
 * `POST` `/api/v1/users/me/memberships/[membershipId]/decline`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import * as workplaceRelationshipService from "@/lib/services/workplaceRelationshipService.ts";

type RouteContext = { params: Promise<{ membershipId: string }> };

export async function POST(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { membershipId } = await context.params;

    const membership = await workplaceRelationshipService.declineInvite(session.id, membershipId);

    return ok({ membership });
  });
}
