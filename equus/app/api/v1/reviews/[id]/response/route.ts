import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { respondToReviewSchema } from "@/lib/validations/review.ts";
import * as reviewService from "@/lib/services/reviewService.ts";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { id } = await context.params;
    const input = respondToReviewSchema.parse(await request.json());

    const review = await reviewService.respondToReview(session.id, id, input);
    return ok({ review });
  });
}
