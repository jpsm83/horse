import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import * as relationshipService from "@/lib/services/relationshipService.ts";

type RouteContext = { params: Promise<{ id: string }> };

const VALID_STATUSES = ["accepted", "ended"] as const;

export async function GET(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const statusFilter = VALID_STATUSES.includes(statusParam as typeof VALID_STATUSES[number])
      ? (statusParam as "accepted" | "ended")
      : undefined;

    const relationships = await relationshipService.listProvidersForHorse(
      session.id,
      id,
      statusFilter,
    );

    return ok({ relationships });
  });
}
