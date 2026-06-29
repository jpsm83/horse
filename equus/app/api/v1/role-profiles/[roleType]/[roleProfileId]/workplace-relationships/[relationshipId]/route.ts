/**
 * Update or end a workplace collaboration.
 *
 * `PATCH` / `DELETE` `/api/v1/role-profiles/[roleType]/[roleProfileId]/workplace-relationships/[relationshipId]`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { parseBusinessRoleType } from "@/lib/roleProfiles/businessRoleProfile.ts";
import { updateCollaboratorSchema } from "@/lib/validations/workplaceRelationship.ts";
import * as workplaceRelationshipService from "@/lib/services/workplaceRelationshipService.ts";

type RouteContext = {
  params: Promise<{ roleType: string; roleProfileId: string; relationshipId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { roleType: roleTypeParam, roleProfileId, relationshipId } = await context.params;
    const roleType = parseBusinessRoleType(roleTypeParam);
    const input = updateCollaboratorSchema.parse(await request.json());

    const collaboration = await workplaceRelationshipService.updateCollaborator(
      session.id,
      roleType,
      roleProfileId,
      relationshipId,
      input,
    );

    return ok({ collaboration, membership: collaboration });
  });
}

export async function DELETE(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { roleType: roleTypeParam, roleProfileId, relationshipId } = await context.params;
    const roleType = parseBusinessRoleType(roleTypeParam);

    const collaboration = await workplaceRelationshipService.endCollaboration(
      session.id,
      roleType,
      roleProfileId,
      relationshipId,
    );

    return ok({ collaboration, membership: collaboration });
  });
}
