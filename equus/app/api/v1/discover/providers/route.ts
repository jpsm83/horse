/**
 * Discover provider profiles for invitation pickers.
 *
 * `GET` `/api/v1/discover/providers?type=&q=&limit=&scope=horse`
 */

import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { discoverProvidersQuerySchema } from "@/lib/validations/discover.ts";
import * as discoverService from "@/lib/services/discoverService.ts";

export async function GET(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { searchParams } = new URL(request.url);

    const query = discoverProvidersQuerySchema.parse({
      type: searchParams.get("type") ?? undefined,
      q: searchParams.get("q") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      scope: searchParams.get("scope") ?? undefined,
    });

    const providers = await discoverService.searchDiscoverProviders(session.id, query);

    return ok({ providers });
  });
}
