/**
 * Veterinary profile creation route.
 *
 * `POST` `/api/v1/veterinaries`
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
