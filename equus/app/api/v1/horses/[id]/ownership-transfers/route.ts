/**
 * Outbound pending ownership transfers for a horse the user owns as main owner.
 *
 * `GET` `/api/v1/horses/[id]/ownership-transfers?status=pending`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { listOwnershipTransfersQuerySchema } from "@/lib/validations/ownershipTransfer.ts";
import * as ownershipTransferService from "@/lib/services/ownershipTransferService.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const query = listOwnershipTransfersQuerySchema.parse({
      status: searchParams.get("status") ?? undefined,
    });

    if (query.status && query.status !== "pending") {
      return ok({ transfers: [] });
    }

    const transfers = await ownershipTransferService.listPendingSentForHorse(
      session.id,
      id,
    );

    return ok({ transfers });
  });
}
