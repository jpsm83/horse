import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import Document from "@/models/Document.ts";
import * as docService from "@/lib/services/horseDocumentService.ts";

type RouteContext = { params: Promise<{ docId: string }> };

export async function DELETE(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    await requireAuthFromRequest(request);
    const { docId } = await context.params;

    const doc = await Document.findById(docId).select("storagePublicId").lean();
    if (!doc) {
      throw new ApiError(404, "Document not found", "NOT_FOUND");
    }

    await docService.deleteHorseDocument(docId, doc.storagePublicId as string | undefined);
    return ok({ deleted: true });
  });
}
