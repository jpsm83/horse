/**
 * Create ownership transfer invitations.
 *
 * `POST` `/api/v1/ownership-transfers` — main owner initiates a pending transfer.
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { createOwnershipTransferSchema } from "@/lib/validations/ownershipTransfer.ts";
import * as ownershipTransferService from "@/lib/services/ownershipTransferService.ts";

export async function POST(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const input = createOwnershipTransferSchema.parse(await request.json());

    const transfer = await ownershipTransferService.createOwnershipTransfer(
      session.id,
      input,
    );

    return ok({ transfer });
  });
}
