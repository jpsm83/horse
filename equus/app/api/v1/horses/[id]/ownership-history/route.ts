/**
 * Ownership history for a horse — all accepted OwnershipTransfer records.
 *
 * `GET` `/api/v1/horses/[id]/ownership-history`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import * as ownershipTransferService from "@/lib/services/ownershipTransferService.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;

    const transfers = await ownershipTransferService.listOwnershipHistoryForHorse(
      session.id,
      id,
    );

    return ok({ transfers });
  });
}
