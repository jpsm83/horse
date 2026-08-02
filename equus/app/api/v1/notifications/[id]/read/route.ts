/**
 * Mark a notification as read.
 *
 * `PATCH` `/api/v1/notifications/[id]/read` — adds the authenticated user to the
 * notification's `readByUserIds`. Idempotent. 404 when the notification does not
 * target the user or is tombstoned.
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import * as notificationService from "@/lib/services/notificationService.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;

    await notificationService.markNotificationAsRead(session.id, id);
    return ok({ success: true });
  });
}
