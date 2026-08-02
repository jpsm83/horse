/**
 * Veterinary profile routes — creation and owned-list.
 *
 * `POST` `/api/v1/veterinaries` — create a veterinary profile for the
 *   authenticated user (409 when the user already has one).
 * `GET`  `/api/v1/veterinaries` — list the veterinary profile(s) owned by the
 *   user (user-linked roles hold at most one, so this returns a single entry or
 *   none).
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { createVeterinarySchema } from "@/lib/validations/veterinary.ts";
import * as veterinaryService from "@/lib/services/veterinaryService.ts";

export async function POST(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const input = createVeterinarySchema.parse(await request.json());
    const veterinary = await veterinaryService.createVeterinary(session.id, input);
    return ok({ veterinary }, 201);
  });
}

export async function GET(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const data = await veterinaryService.listVeterinariesForOwner(session.id);
    return ok(data);
  });
}
