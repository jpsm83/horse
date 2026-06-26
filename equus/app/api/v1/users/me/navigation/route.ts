/**
 * Owned-profile navigation flags for the signed-in user's header menu.
 *
 * `GET` `/api/v1/users/me/navigation`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import * as navigationService from "@/lib/services/navigationService.ts";

export async function GET(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const owned = await navigationService.getUserOwnedNavigation(session.id);
    return ok({ owned });
  });
}
