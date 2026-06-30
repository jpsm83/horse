/**
 * Create or respond to horse relationship invitations.
 *
 * `POST` `/api/v1/relationships` — owner sends invite
 * `PATCH` `/api/v1/relationships/:id` — invitee accepts or declines (see [id]/route.ts)
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { createRelationshipSchema } from "@/lib/validations/relationship.ts";
import * as relationshipService from "@/lib/services/relationshipService.ts";

export async function POST(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const input = createRelationshipSchema.parse(await request.json());

    const relationship = await relationshipService.createRelationshipInvite(session.id, input);

    return ok({ relationship });
  });
}
