/**
 * Horse routes.
 *
 * `POST` `/api/v1/horses` — create (auth required)
 * `GET`  `/api/v1/horses` — list (optional auth; returns owned or public horses)
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest, readOptionalAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { createHorseSchema } from "@/lib/validations/horse.ts";
import * as horseService from "@/lib/services/horseService.ts";

function parseListParams(url: string): horseService.HorseListFilters {
  const parsed = new URL(url);
  return {
    mine: parsed.searchParams.get("mine") === "true" ? true : undefined,
    forSale: parsed.searchParams.get("forSale") === "true" ? true : undefined,
    breed: parsed.searchParams.get("breed") ?? undefined,
    sex: parsed.searchParams.get("sex") ?? undefined,
    countryOfBirth: parsed.searchParams.get("countryOfBirth") ?? undefined,
    ageMin: parsed.searchParams.get("ageMin") ? Number(parsed.searchParams.get("ageMin")) : undefined,
    ageMax: parsed.searchParams.get("ageMax") ? Number(parsed.searchParams.get("ageMax")) : undefined,
    valueMin: parsed.searchParams.get("valueMin") ? Number(parsed.searchParams.get("valueMin")) : undefined,
    valueMax: parsed.searchParams.get("valueMax") ? Number(parsed.searchParams.get("valueMax")) : undefined,
    page: parsed.searchParams.get("page") ? Number(parsed.searchParams.get("page")) : undefined,
    limit: parsed.searchParams.get("limit") ? Number(parsed.searchParams.get("limit")) : undefined,
  };
}

export async function GET(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const requester = await readOptionalAuthFromRequest(request);
    const filters = parseListParams(request.url);
    return ok(await horseService.listHorses(requester.id, filters));
  });
}

export async function POST(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const input = createHorseSchema.parse(await request.json());
    const horse = await horseService.createHorse(session.id, input);
    return ok({ horse }, 201);
  });
}

