import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest, readOptionalAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { createReviewSchema, listReviewsQuerySchema } from "@/lib/validations/review.ts";
import * as reviewService from "@/lib/services/reviewService.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const { id } = await context.params;

    const reviews = await reviewService.listReviewsForHorse(id);
    return ok({ reviews });
  });
}

export async function POST(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const input = createReviewSchema.parse(await request.json());

    const review = await reviewService.createReview(session.id, id, input);
    return ok({ review }, 201);
  });
}
