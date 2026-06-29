/**
 * Staff REST routes — list and invite staff on a business role profile.
 *
 * `GET` / `POST` `/api/v1/role-profiles/[roleType]/[roleProfileId]/staff`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { parseBusinessRoleType } from "@/lib/roleProfiles/businessRoleProfile.ts";
import { inviteCollaboratorSchema } from "@/lib/validations/workplaceRelationship.ts";
import * as workplaceRelationshipService from "@/lib/services/workplaceRelationshipService.ts";

type RouteContext = { params: Promise<{ roleType: string; roleProfileId: string }> };

export async function GET(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { roleType: roleTypeParam, roleProfileId } = await context.params;
    const roleType = parseBusinessRoleType(roleTypeParam);

    const staff = await workplaceRelationshipService.listCollaborators(
      session.id,
      roleType,
      roleProfileId,
    );

    return ok({ staff });
  });
}

export async function POST(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { roleType: roleTypeParam, roleProfileId } = await context.params;
    const roleType = parseBusinessRoleType(roleTypeParam);
    const input = inviteCollaboratorSchema.parse(await request.json());

    const collaboration = await workplaceRelationshipService.inviteCollaborator(
      session.id,
      roleType,
      roleProfileId,
      input,
    );

    return ok({ collaboration, membership: collaboration }, 201);
  });
}
