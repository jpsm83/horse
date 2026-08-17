import connectDb from "@/lib/db.ts";
import { withRoute, ok, fail } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { createEntityCheckoutSession } from "@/lib/billing/stripe.ts";
import type { BillingCurrencyCode } from "@/lib/billing/entityCatalog.ts";

export async function POST(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const body = await request.json();
    const stableId = body?.stableId as string | undefined;
    if (!stableId) {
      return fail(400, "stableId is required", "VALIDATION_ERROR");
    }
    const currency = (body?.currency as BillingCurrencyCode | undefined) ?? "EUR";
    const result = await createEntityCheckoutSession(session.id, stableId, currency);
    return ok(result);
  });
}
