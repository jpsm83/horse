import { NextResponse } from "next/server";
import connectDb from "@/lib/db.ts";
import { withRoute } from "@/lib/api/response.ts";
import Stripe from "stripe";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key, {});
}

export async function POST(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const stripe = getStripe();
    const body = await request.text();
    const sig = request.headers.get("stripe-signature") || "";
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
    const event = stripe.webhooks.constructEvent(body, sig, secret);
    const { handleSubscriptionWebhook } = await import("@/lib/billing/stripe.ts");
    await handleSubscriptionWebhook(event);
    return new NextResponse("OK", { status: 200 });
  });
}
