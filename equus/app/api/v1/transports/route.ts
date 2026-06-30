/**
 * Transport company creation route.
 *
 * `POST` `/api/v1/transports`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { createTransportSchema } from "@/lib/validations/transport.ts";
import * as transportService from "@/lib/services/transportService.ts";

export async function POST(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const input = createTransportSchema.parse(await request.json());
    const transport = await transportService.createTransport(session.id, input);
    return ok({ transport }, 201);
  });
}
