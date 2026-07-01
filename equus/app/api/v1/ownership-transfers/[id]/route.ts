/**
 * Respond to or cancel a pending ownership transfer.
 *
 * `PATCH` `/api/v1/ownership-transfers/:id` — receiver accepts or declines
 * `DELETE` `/api/v1/ownership-transfers/:id` — initiator cancels pending
 */

import connectDb from "@/lib/db.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import {
  ownershipTransferIdParamSchema,
  updateOwnershipTransferStatusSchema,
} from "@/lib/validations/ownershipTransfer.ts";
import * as ownershipTransferService from "@/lib/services/ownershipTransferService.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const parsedId = ownershipTransferIdParamSchema.safeParse(id);

    if (!parsedId.success) {
      throw new ApiError(400, "Invalid ownership transfer id", "VALIDATION_ERROR");
    }

    const { status } = updateOwnershipTransferStatusSchema.parse(await request.json());

    const transfer =
      status === "accepted"
        ? await ownershipTransferService.acceptOwnershipTransfer(session.id, parsedId.data)
        : await ownershipTransferService.declineOwnershipTransfer(session.id, parsedId.data);

    return ok({ transfer });
  });
}

export async function DELETE(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const parsedId = ownershipTransferIdParamSchema.safeParse(id);

    if (!parsedId.success) {
      throw new ApiError(400, "Invalid ownership transfer id", "VALIDATION_ERROR");
    }

    const transfer = await ownershipTransferService.cancelOwnershipTransfer(
      session.id,
      parsedId.data,
    );

    return ok({ transfer });
  });
}
