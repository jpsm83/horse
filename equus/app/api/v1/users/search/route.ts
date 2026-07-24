/**
 * `GET` `/api/v1/users/search?q=` — search active users by username, email,
 * first name, or last name. Used by horse Admin ownership invite UI.
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { searchUsers } from "@/lib/services/userService.ts";

export async function GET(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const q = new URL(request.url).searchParams.get("q") ?? "";

    const results = await searchUsers(q, { excludeUserId: session.id, limit: 10 });
    return ok({ results });
  });
}
