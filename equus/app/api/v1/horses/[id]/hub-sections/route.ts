/**
 * Horse Hub section visibility (Layer 2).
 *
 * `PATCH` `/api/v1/horses/[id]/hub-sections` — partial `hubSections` map.
 * Separate from Layer-1 discovery (`profileVisibility`) and profile field PATCH.
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { updateHorseHubSectionsSchema } from "@/lib/validations/horse.ts";
import * as horseService from "@/lib/services/horseService.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const input = updateHorseHubSectionsSchema.parse(await request.json());
    const horse = await horseService.updateHorseHubSections(session.id, id, input);
    return ok({ horse });
  });
}
