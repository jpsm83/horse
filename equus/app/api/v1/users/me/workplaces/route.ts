/**
 * User workplaces — owned business profiles and staff memberships (including pending invites).
 *
 * `GET` `/api/v1/users/me/workplaces`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import * as roleMembershipService from "@/lib/services/roleMembershipService.ts";

export async function GET(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);

    const workplaces = await roleMembershipService.listWorkplacesForUser(session.id);

    return ok({ workplaces });
  });
}
