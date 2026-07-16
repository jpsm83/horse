import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import * as planningService from "@/lib/services/horsePlanningService.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;
    const events = await planningService.listPlanning(id, from, to);
    return ok({ events });
  });
}

export async function POST(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const input = await request.json();
    const event = await planningService.createPlanningItem(session.id, id, input);
    return ok({ event }, 201);
  });
}
