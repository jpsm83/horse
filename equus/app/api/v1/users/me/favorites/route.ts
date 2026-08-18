/**
 * Current-user favorites — list, add, remove private entity bookmarks.
 *
 * GET    `/api/v1/users/me/favorites?entityType=horse|stable`
 * POST   `/api/v1/users/me/favorites` — body `{ entityType, entityId }`
 * DELETE `/api/v1/users/me/favorites` — body `{ entityType, entityId }`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import {
  favoriteMutationSchema,
  listFavoritesQuerySchema,
} from "@/lib/validations/favorite.ts";
import * as favoriteService from "@/lib/services/favoriteService.ts";

export async function GET(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { searchParams } = new URL(request.url);
    const query = listFavoritesQuerySchema.parse({
      entityType: searchParams.get("entityType") ?? undefined,
    });
    const favorites = await favoriteService.listFavorites(session.id, query.entityType);
    return ok({ favorites });
  });
}

export async function POST(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const input = favoriteMutationSchema.parse(await request.json());
    await favoriteService.addFavorite(session.id, input.entityType, input.entityId);
    return ok({ success: true }, 201);
  });
}

export async function DELETE(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const input = favoriteMutationSchema.parse(await request.json());
    await favoriteService.removeFavorite(session.id, input.entityType, input.entityId);
    return ok({ success: true });
  });
}
