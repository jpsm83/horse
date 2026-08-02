/**
 * Farrier routes — creation and owned-list.
 *
 * `POST` `/api/v1/farriers` — create a farrier profile linked to the authenticated user.
 * `GET`  `/api/v1/farriers?mine=true` — list farrier profiles owned by the user.
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { createFarrierSchema } from "@/lib/validations/farrier.ts";
import * as farrierService from "@/lib/services/farrierService.ts";

export async function POST(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const input = createFarrierSchema.parse(await request.json());
    const farrier = await farrierService.createFarrier(session.id, input);
    return ok({ farrier }, 201);
  });
}

export async function GET(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const data = await farrierService.listFarriersForOwner(session.id);
    return ok(data);
  });
}
