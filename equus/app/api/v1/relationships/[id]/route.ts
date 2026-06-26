/**
 * Accept or decline a pending relationship invitation.
 *
 * `PATCH` `/api/v1/relationships/:id`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { updateRelationshipStatusSchema } from "@/lib/validations/relationship.ts";
import * as relationshipService from "@/lib/services/relationshipService.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const { status } = updateRelationshipStatusSchema.parse(await request.json());

    const relationship =
      status === "accepted"
        ? await relationshipService.acceptRelationship(session.id, id)
        : await relationshipService.declineRelationship(session.id, id);

    return ok({ relationship });
  });
}
