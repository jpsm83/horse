/**
 * User notification preferences.
 *
 * `GET`   `/api/v1/users/me/notifications` — current preferences
 * `PATCH` `/api/v1/users/me/notifications` — partial update
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { updateUserNotificationPreferencesSchema } from "@/lib/validations/user.ts";
import * as userService from "@/lib/services/userService.ts";

export async function GET(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const notificationPreferences = await userService.getNotificationPreferences(session.id);
    return ok({ notificationPreferences });
  });
}

export async function PATCH(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const input = updateUserNotificationPreferencesSchema.parse(await request.json());
    const notificationPreferences = await userService.updateNotificationPreferences(
      session.id,
      input as Record<string, unknown>,
    );
    return ok({ notificationPreferences });
  });
}
