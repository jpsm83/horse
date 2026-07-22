import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import * as docService from "@/lib/services/horseDocumentService.ts";

type RouteContext = { params: Promise<{ id: string; docId: string }> };

export async function DELETE(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id: horseId, docId } = await context.params;

    await docService.deleteHorseDocument(session.id, horseId, docId);
    return ok({ deleted: true });
  });
}
