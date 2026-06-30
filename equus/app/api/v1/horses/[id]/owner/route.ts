/**
 * Owner horse read route.
 *
 * `GET` `/api/v1/horses/[id]/owner`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import * as horseService from "@/lib/services/horseService.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const horse = await horseService.getHorseForOwner(session.id, id);

    return ok({
      horse: {
        id: String(horse._id),
        name: horse.name as string | undefined,
        breed: horse.breed as string | undefined,
        sex: horse.sex as string | undefined,
      },
    });
  });
}
