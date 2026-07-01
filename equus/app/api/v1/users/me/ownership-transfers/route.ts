/**
 * Pending ownership transfers for the authenticated user (inbox).
 *
 * `GET` `/api/v1/users/me/ownership-transfers?status=pending`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { listOwnershipTransfersQuerySchema } from "@/lib/validations/ownershipTransfer.ts";
import * as ownershipTransferService from "@/lib/services/ownershipTransferService.ts";

export async function GET(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { searchParams } = new URL(request.url);
    const query = listOwnershipTransfersQuerySchema.parse({
      status: searchParams.get("status") ?? undefined,
    });

    if (query.status && query.status !== "pending") {
      return ok({ transfers: [] });
    }

    const transfers = await ownershipTransferService.listPendingOwnershipTransfersForUser(
      session.id,
      session.email,
    );

    return ok({ transfers });
  });
}
