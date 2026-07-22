import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { respondDocumentDeletionRequestSchema } from "@/lib/validations/documentDeletion.ts";
import * as documentDeletionService from "@/lib/services/documentDeletionService.ts";

type RouteContext = { params: Promise<{ requestId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { requestId } = await context.params;
    const input = respondDocumentDeletionRequestSchema.parse(await request.json());

    let result;
    if (input.status === "approved") {
      result = await documentDeletionService.approveDeletionRequest(
        session.id,
        requestId,
      );
    } else {
      result = await documentDeletionService.declineDeletionRequest(
        session.id,
        requestId,
        input.responseMessage,
      );
    }
    return ok({ request: result });
  });
}

export async function DELETE(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { requestId } = await context.params;
    const result = await documentDeletionService.cancelDeletionRequest(
      session.id,
      requestId,
    );
    return ok({ request: result });
  });
}
