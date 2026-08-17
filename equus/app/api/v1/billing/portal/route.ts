import connectDb from "@/lib/db.ts";
import { withRoute, ok, fail } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { createEntityPortalSession } from "@/lib/billing/stripe.ts";

export async function POST(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const body = await request.json().catch(() => ({}));
    const stableId = (body as { stableId?: string }).stableId;
    if (!stableId) {
      return fail(400, "stableId is required", "VALIDATION_ERROR");
    }
    const result = await createEntityPortalSession(session.id, stableId);
    return ok(result);
  });
}
