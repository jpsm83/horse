/**
 * User hub section visibility (Layer 2).
 *
 * `PATCH` `/api/v1/users/me/hub-sections` — update a single section visibility mode.
 * Separate from Layer-1 profile visibility (`preferences.profileVisibility`).
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { updateUserHubSectionSchema } from "@/lib/validations/user.ts";
import * as userService from "@/lib/services/userService.ts";

export async function PATCH(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { sectionKey, mode } = updateUserHubSectionSchema.parse(await request.json());
    const user = await userService.updateUserHubSection(session.id, sectionKey, mode);
    return ok({ user });
  });
}
