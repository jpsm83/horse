/**
 * Current-user block list — list and block.
 *
 * GET  `/api/v1/users/me/blocks`
 * POST `/api/v1/users/me/blocks`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { blockUserSchema } from "@/lib/validations/chat.ts";
import * as chatService from "@/lib/services/chatService.ts";

export async function GET(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const blockedUserIds = await chatService.listBlockedUserIds(session.id);
    return ok({ blockedUserIds });
  });
}

export async function POST(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const input = blockUserSchema.parse(await request.json());
    await chatService.blockUser(session.id, input.blockedUserId);
    return ok({ success: true }, 201);
  });
}
