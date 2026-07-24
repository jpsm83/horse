/**
 * Respond to or cancel a pending pedigree connection.
 *
 * `PATCH` `/api/v1/pedigree-connections/:id` — receiver accepts or declines
 * `DELETE` `/api/v1/pedigree-connections/:id` — initiator cancels pending
 */

import connectDb from "@/lib/db.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import {
  pedigreeConnectionIdParamSchema,
  updatePedigreeConnectionStatusSchema,
} from "@/lib/validations/pedigreeConnection.ts";
import * as pedigreeConnectionService from "@/lib/services/pedigreeConnectionService.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const parsedId = pedigreeConnectionIdParamSchema.safeParse(id);

    if (!parsedId.success) {
      throw new ApiError(400, "Invalid pedigree connection id", "VALIDATION_ERROR");
    }

    const { status } = updatePedigreeConnectionStatusSchema.parse(await request.json());

    const connection =
      status === "accepted"
        ? await pedigreeConnectionService.acceptPedigreeConnection(session.id, parsedId.data)
        : await pedigreeConnectionService.declinePedigreeConnection(session.id, parsedId.data);

    return ok({ connection });
  });
}

export async function DELETE(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const parsedId = pedigreeConnectionIdParamSchema.safeParse(id);

    if (!parsedId.success) {
      throw new ApiError(400, "Invalid pedigree connection id", "VALIDATION_ERROR");
    }

    const connection = await pedigreeConnectionService.cancelPedigreeConnection(
      session.id,
      parsedId.data,
    );

    return ok({ connection });
  });
}
