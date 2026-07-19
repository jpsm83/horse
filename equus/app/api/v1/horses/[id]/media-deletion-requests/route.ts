import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import {
  createMediaDeletionRequestSchema,
  listMediaDeletionRequestsQuerySchema,
} from "@/lib/validations/mediaDeletion.ts";
import * as mediaDeletionService from "@/lib/services/mediaDeletionService.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id: horseId } = await context.params;
    const url = new URL(request.url);
    const query = listMediaDeletionRequestsQuerySchema.parse(
      Object.fromEntries(url.searchParams),
    );
    const requests = await mediaDeletionService.listDeletionRequests(
      session.id,
      horseId,
      query.status,
    );
    return ok({ requests });
  });
}

export async function POST(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id: horseId } = await context.params;
    const input = createMediaDeletionRequestSchema.parse(await request.json());
    const result = await mediaDeletionService.createDeletionRequest(
      session.id,
      horseId,
      input.mediaId,
      input.requestMessage,
    );
    return ok({ request: result });
  });
}
