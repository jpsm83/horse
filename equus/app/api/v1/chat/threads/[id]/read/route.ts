/**
 * Mark all messages in a thread read for the session user.
 *
 * PATCH `/api/v1/chat/threads/:id/read`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import * as chatService from "@/lib/services/chatService.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(_request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(_request);
    const { id } = await context.params;
    await chatService.markThreadRead(id, session.id);
    return ok({ success: true });
  });
}
