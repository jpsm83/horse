import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { respondMediaDeletionRequestSchema } from "@/lib/validations/mediaDeletion.ts";
import * as mediaDeletionService from "@/lib/services/mediaDeletionService.ts";

type RouteContext = { params: Promise<{ requestId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { requestId } = await context.params;
    const input = respondMediaDeletionRequestSchema.parse(await request.json());

    let result;
    if (input.status === "approved") {
      result = await mediaDeletionService.approveDeletionRequest(
        session.id,
        requestId,
      );
    } else {
      result = await mediaDeletionService.declineDeletionRequest(
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
    const result = await mediaDeletionService.cancelDeletionRequest(
      session.id,
      requestId,
    );
    return ok({ request: result });
  });
}
