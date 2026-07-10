import connectDb from "@/lib/db.ts";
import { withRoute, ok } from "@/lib/api/response.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import { createCheckoutSession } from "@/lib/billing/stripe.ts";

export async function POST(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const session = await requireAuthFromRequest(request);
    const { tierId, currency } = await request.json();
    const result = await createCheckoutSession(session.id, tierId, currency);
    return ok(result);
  });
}
