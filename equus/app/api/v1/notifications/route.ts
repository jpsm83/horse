/**
 * Notification inbox.
 *
 * `GET` `/api/v1/notifications` — paginated notifications for the authenticated
 * user (`?page=1&limit=20`). Requires auth; returns `{ notifications, total,
 * page, totalPages }`.
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import * as notificationService from "@/lib/services/notificationService.ts";

function parsePositiveInt(raw: string | null, fallback: number): number {
  if (raw == null || raw.trim() === "") return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.floor(n);
}

export async function GET(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const url = new URL(request.url);
    const page = parsePositiveInt(url.searchParams.get("page"), 1);
    const limit = parsePositiveInt(url.searchParams.get("limit"), 20);

    if (page < 1 || limit < 1 || limit > 50) {
      throw new ApiError(400, "Invalid page or limit", "VALIDATION_ERROR");
    }

    const data = await notificationService.listNotifications(session.id, page, limit);
    return ok(data);
  });
}
