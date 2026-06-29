/**
 * Accept a pending workplace collaboration invitation.
 *
 * `POST` `/api/v1/users/me/workplace-invitations/[invitationId]/accept`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import * as workplaceRelationshipService from "@/lib/services/workplaceRelationshipService.ts";

type RouteContext = { params: Promise<{ invitationId: string }> };

export async function POST(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { invitationId } = await context.params;

    const collaboration = await workplaceRelationshipService.acceptInvite(
      session.id,
      invitationId,
    );

    return ok({ collaboration, membership: collaboration });
  });
}
