/**
 * Pending pedigree connections for the authenticated user (inbox).
 *
 * `GET` `/api/v1/users/me/pedigree-connections?status=pending`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { listPedigreeConnectionsQuerySchema } from "@/lib/validations/pedigreeConnection.ts";
import * as pedigreeConnectionService from "@/lib/services/pedigreeConnectionService.ts";

export async function GET(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { searchParams } = new URL(request.url);
    const query = listPedigreeConnectionsQuerySchema.parse({
      status: searchParams.get("status") ?? undefined,
    });

    if (query.status && query.status !== "pending") {
      return ok({ connections: [] });
    }

    const connections = await pedigreeConnectionService.listPendingPedigreeConnectionsForUser(
      session.id,
      session.email,
    );

    return ok({ connections });
  });
}
