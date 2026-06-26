/**
 * Staff REST routes — list and invite staff on a business role profile.
 *
 * `GET` / `POST` `/api/v1/role-profiles/[roleType]/[roleProfileId]/staff`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { parseBusinessRoleType } from "@/lib/roleProfiles/businessRoleProfile.ts";
import { inviteStaffSchema } from "@/lib/validations/roleMembership.ts";
import * as roleMembershipService from "@/lib/services/roleMembershipService.ts";

type RouteContext = { params: Promise<{ roleType: string; roleProfileId: string }> };

export async function GET(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { roleType: roleTypeParam, roleProfileId } = await context.params;
    const roleType = parseBusinessRoleType(roleTypeParam);

    const staff = await roleMembershipService.listStaff(
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
    const input = inviteStaffSchema.parse(await request.json());

    const membership = await roleMembershipService.inviteStaff(
      session.id,
      roleType,
      roleProfileId,
      input,
    );

    return ok({ membership }, 201);
  });
}
