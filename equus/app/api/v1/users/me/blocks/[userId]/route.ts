/**
 * Unblock a user.
 *
 * DELETE `/api/v1/users/me/blocks/:userId`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import * as chatService from "@/lib/services/chatService.ts";

type RouteContext = { params: Promise<{ userId: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(_request);
    const { userId } = await context.params;
    await chatService.unblockUser(session.id, userId);
    return ok({ success: true });
  });
}
