import connectDb from "@/lib/db.ts";
import { withRoute, ok, fail } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { getStableBillingForOwner } from "@/lib/billing/stripe.ts";

export async function GET(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const stableId = new URL(request.url).searchParams.get("stableId");
    if (!stableId) {
      return fail(400, "stableId query parameter is required", "VALIDATION_ERROR");
    }
    const billing = await getStableBillingForOwner(session.id, stableId);
    return ok(billing);
  });
}
