/**
 * Waiting-transfer horses for the authenticated user (home inbox).
 *
 * `GET` `/api/v1/users/me/waiting-transfer-horses`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { listWaitingTransferHorsesForUser } from "@/lib/services/waitingTransferService.ts";

export async function GET(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const horses = await listWaitingTransferHorsesForUser(session.id, session.email);
    return ok({ horses });
  });
}
