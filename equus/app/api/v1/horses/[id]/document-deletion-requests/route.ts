import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import {
  createDocumentDeletionRequestSchema,
  listDocumentDeletionRequestsQuerySchema,
} from "@/lib/validations/documentDeletion.ts";
import * as documentDeletionService from "@/lib/services/documentDeletionService.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id: horseId } = await context.params;
    const url = new URL(request.url);
    const query = listDocumentDeletionRequestsQuerySchema.parse(
      Object.fromEntries(url.searchParams),
    );
    const requests = await documentDeletionService.listDeletionRequests(
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
    const input = createDocumentDeletionRequestSchema.parse(await request.json());
    const result = await documentDeletionService.createDeletionRequest(
      session.id,
      horseId,
      input.documentId,
      input.requestMessage,
    );
    return ok({ request: result });
  });
}
