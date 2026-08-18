/**
 * Chat thread messages — list and send.
 *
 * GET  `/api/v1/chat/threads/:id/messages`
 * POST `/api/v1/chat/threads/:id/messages`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import {
  listMessagesQuerySchema,
  sendMessageSchema,
} from "@/lib/validations/chat.ts";
import * as chatService from "@/lib/services/chatService.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const query = listMessagesQuerySchema.parse({
      before: searchParams.get("before") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });
    const result = await chatService.listMessages(id, session.id, query);
    return ok(result);
  });
}

export async function POST(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const input = sendMessageSchema.parse(await request.json());
    const result = await chatService.sendMessage(id, session.id, input);
    return ok(result, 201);
  });
}
