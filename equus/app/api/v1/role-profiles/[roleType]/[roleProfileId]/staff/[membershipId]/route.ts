/**
 * Single staff membership routes — update role or revoke.
 *
 * `PATCH` / `DELETE` `/api/v1/role-profiles/[roleType]/[roleProfileId]/staff/[membershipId]`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { parseBusinessRoleType } from "@/lib/roleProfiles/businessRoleProfile.ts";
import { updateStaffRoleSchema } from "@/lib/validations/roleMembership.ts";
import * as roleMembershipService from "@/lib/services/roleMembershipService.ts";

type RouteContext = {
  params: Promise<{ roleType: string; roleProfileId: string; membershipId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { roleType: roleTypeParam, roleProfileId, membershipId } = await context.params;
    const roleType = parseBusinessRoleType(roleTypeParam);
    const input = updateStaffRoleSchema.parse(await request.json());

    const membership = await roleMembershipService.updateStaffRole(
      session.id,
      roleType,
      roleProfileId,
      membershipId,
      input,
    );

    return ok({ membership });
  });
}

export async function DELETE(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { roleType: roleTypeParam, roleProfileId, membershipId } = await context.params;
    const roleType = parseBusinessRoleType(roleTypeParam);

    const membership = await roleMembershipService.revokeMembership(
      session.id,
      roleType,
      roleProfileId,
      membershipId,
    );

    return ok({ membership });
  });
}
