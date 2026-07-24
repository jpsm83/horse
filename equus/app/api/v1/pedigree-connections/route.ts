/**
 * Create pedigree connection invitations.
 *
 * `POST` `/api/v1/pedigree-connections`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { createPedigreeConnectionSchema } from "@/lib/validations/pedigreeConnection.ts";
import * as pedigreeConnectionService from "@/lib/services/pedigreeConnectionService.ts";

export async function POST(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const input = createPedigreeConnectionSchema.parse(await request.json());

    const connection = await pedigreeConnectionService.createPedigreeConnection(
      session.id,
      input,
    );

    return ok({ connection });
  });
}
