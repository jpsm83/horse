/**
 * Breeder creation route.
 *
 * `POST` `/api/v1/breeders`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { createBreederSchema } from "@/lib/validations/breeder.ts";
import * as breederService from "@/lib/services/breederService.ts";

export async function POST(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const input = createBreederSchema.parse(await request.json());
    const breeder = await breederService.createBreeder(session.id, input);
    return ok({ breeder }, 201);
  });
}
