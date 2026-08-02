/**
 * Breeder routes — creation and owned-list.
 *
 * `POST` `/api/v1/breeders` — create a breeder owned by the authenticated user.
 * `GET`  `/api/v1/breeders?mine=true` — list breeders owned by the user.
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

export async function GET(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const limit = Number(url.searchParams.get("limit") ?? 20);
    const data = await breederService.listBreedersForOwner(session.id, page, limit);
    return ok(data);
  });
}
