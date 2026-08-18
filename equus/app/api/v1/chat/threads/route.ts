/**
 * Chat threads — list and find-or-create 1:1 conversations.
 *
 * GET  `/api/v1/chat/threads`
 * POST `/api/v1/chat/threads`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import {
  createThreadSchema,
  listThreadsQuerySchema,
} from "@/lib/validations/chat.ts";
import * as chatService from "@/lib/services/chatService.ts";

export async function GET(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { searchParams } = new URL(request.url);
    const query = listThreadsQuerySchema.parse({
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
    });
    const result = await chatService.listThreads(session.id, query.page, query.pageSize);
    return ok(result);
  });
}

export async function POST(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const input = createThreadSchema.parse(await request.json());
    const result = await chatService.findOrCreateThread(session.id, input.targetUserId, {
      contextPrefix: input.contextPrefix,
      initialBody: input.initialBody,
    });
    return ok(result, result.created ? 201 : 200);
  });
}
