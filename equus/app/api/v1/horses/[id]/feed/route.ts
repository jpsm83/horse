import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { createFeedPlanSchema } from "@/lib/validations/horseFeed.ts";
import * as feedService from "@/lib/services/horseFeedService.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const plans = await feedService.listFeedPlans(id);
    return ok({ plans });
  });
}

export async function POST(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const input = createFeedPlanSchema.parse(await request.json());
    const plan = await feedService.createFeedPlan(session.id, id, input);
    return ok({ plan }, 201);
  });
}
