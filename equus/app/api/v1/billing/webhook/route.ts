import { NextResponse } from "next/server";
import connectDb from "@/lib/db.ts";
import { withRoute } from "@/lib/api/response.ts";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {});

export async function POST(request: Request) {
  return withRoute(async () => {
    await connectDb();
    const body = await request.text();
    const sig = request.headers.get("stripe-signature") || "";
    const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    const { handleSubscriptionWebhook } = await import("@/lib/billing/stripe.ts");
    await handleSubscriptionWebhook(event);
    return new NextResponse("OK", { status: 200 });
  });
}
