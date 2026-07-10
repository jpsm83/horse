import Stripe from "stripe";
import User from "@/models/User.ts";
import { SUBSCRIPTION_PLANS, type TierId, type CurrencyCode, getPlan } from "./plans.ts";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Stripe Price IDs per tier per currency — set these env vars in Stripe dashboard
const STRIPE_PRICE_IDS: Record<string, Record<string, string>> = {
  bronze: {
    USD: process.env.STRIPE_PRICE_BRONZE_USD || "",
    EUR: process.env.STRIPE_PRICE_BRONZE_EUR || "",
    GBP: process.env.STRIPE_PRICE_BRONZE_GBP || "",
    BRL: process.env.STRIPE_PRICE_BRONZE_BRL || "",
    CAD: process.env.STRIPE_PRICE_BRONZE_CAD || "",
    AUD: process.env.STRIPE_PRICE_BRONZE_AUD || "",
    CHF: process.env.STRIPE_PRICE_BRONZE_CHF || "",
    JPY: process.env.STRIPE_PRICE_BRONZE_JPY || "",
  },
  silver: {
    USD: process.env.STRIPE_PRICE_SILVER_USD || "",
    EUR: process.env.STRIPE_PRICE_SILVER_EUR || "",
    GBP: process.env.STRIPE_PRICE_SILVER_GBP || "",
    BRL: process.env.STRIPE_PRICE_SILVER_BRL || "",
    CAD: process.env.STRIPE_PRICE_SILVER_CAD || "",
    AUD: process.env.STRIPE_PRICE_SILVER_AUD || "",
    CHF: process.env.STRIPE_PRICE_SILVER_CHF || "",
    JPY: process.env.STRIPE_PRICE_SILVER_JPY || "",
  },
  gold: {
    USD: process.env.STRIPE_PRICE_GOLD_USD || "",
    EUR: process.env.STRIPE_PRICE_GOLD_EUR || "",
    GBP: process.env.STRIPE_PRICE_GOLD_GBP || "",
    BRL: process.env.STRIPE_PRICE_GOLD_BRL || "",
    CAD: process.env.STRIPE_PRICE_GOLD_CAD || "",
    AUD: process.env.STRIPE_PRICE_GOLD_AUD || "",
    CHF: process.env.STRIPE_PRICE_GOLD_CHF || "",
    JPY: process.env.STRIPE_PRICE_GOLD_JPY || "",
  },
  diamond: {
    USD: process.env.STRIPE_PRICE_DIAMOND_USD || "",
    EUR: process.env.STRIPE_PRICE_DIAMOND_EUR || "",
    GBP: process.env.STRIPE_PRICE_DIAMOND_GBP || "",
    BRL: process.env.STRIPE_PRICE_DIAMOND_BRL || "",
    CAD: process.env.STRIPE_PRICE_DIAMOND_CAD || "",
    AUD: process.env.STRIPE_PRICE_DIAMOND_AUD || "",
    CHF: process.env.STRIPE_PRICE_DIAMOND_CHF || "",
    JPY: process.env.STRIPE_PRICE_DIAMOND_JPY || "",
  },
};

export async function createCheckoutSession(userId: string, tierId: TierId, currency: CurrencyCode) {
  const user = await User.findById(userId).select("subscription.stripeCustomerId email");
  if (!user) throw new Error("User not found");

  const priceId = STRIPE_PRICE_IDS[tierId]?.[currency];
  if (!priceId) throw new Error(`No Stripe price configured for ${tierId} in ${currency}`);

  const session = await stripe.checkout.sessions.create({
    customer: user.subscription?.stripeCustomerId || undefined,
    customer_email: user.subscription?.stripeCustomerId ? undefined : user.email,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXTAUTH_URL}/subscription?success=true`,
    cancel_url: `${process.env.NEXTAUTH_URL}/subscription?canceled=true`,
    metadata: { userId, tierId },
    allow_promotion_codes: true,
  });
  return { url: session.url };
}

export async function createPortalSession(userId: string) {
  const user = await User.findById(userId).select("subscription.stripeCustomerId");
  if (!user?.subscription?.stripeCustomerId) throw new Error("No Stripe customer");
  const session = await stripe.billingPortal.sessions.create({
    customer: user.subscription.stripeCustomerId,
    return_url: `${process.env.NEXTAUTH_URL}/subscription`,
  });
  return { url: session.url };
}

interface SubscriptionWithPeriod extends Stripe.Subscription {
  current_period_start: number;
  current_period_end: number;
}

interface InvoiceWithSubscription extends Stripe.Invoice {
  subscription: string;
}

export async function handleSubscriptionWebhook(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const { userId, tierId } = session.metadata || {};
      if (!userId || !tierId) break;
      await User.findByIdAndUpdate(userId, {
        $set: {
          "subscription.tier": tierId,
          "subscription.status": "active",
          "subscription.stripeCustomerId": session.customer as string,
          "subscription.stripeSubscriptionId": session.subscription as string,
          "subscription.currentPeriodStart": new Date(),
          "subscription.currentPeriodEnd": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as SubscriptionWithPeriod;
      const user = await User.findOne({ "subscription.stripeSubscriptionId": sub.id });
      if (!user) break;
      const status = sub.status === "active" ? "active"
        : sub.status === "past_due" ? "past_due"
        : sub.status === "canceled" ? "canceled"
        : sub.status;
      const updates: Record<string, unknown> = {
        "subscription.status": status,
        "subscription.currentPeriodStart": new Date(sub.current_period_start * 1000),
        "subscription.currentPeriodEnd": new Date(sub.current_period_end * 1000),
      };
      if (status === "canceled" || status === "incomplete_expired") {
        updates["subscription.tier"] = "free";
        updates["subscription.canceledAt"] = new Date();
      }
      await User.findByIdAndUpdate(user._id, { $set: updates });
      break;
    }
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as InvoiceWithSubscription;
      const subId = invoice.subscription;
      const user = await User.findOneAndUpdate(
        { "subscription.stripeSubscriptionId": subId },
        { $set: { "subscription.status": "active" } },
      ).select("_id");
      if (user) {
        const { restorePaymentAccess } = await import("./paymentGate.ts");
        await restorePaymentAccess(user._id.toString());
      }
      break;
    }
    case "invoice.payment_failed": {
      const failedInvoice = event.data.object as InvoiceWithSubscription;
      await User.findOneAndUpdate(
        { "subscription.stripeSubscriptionId": failedInvoice.subscription },
        { $set: { "subscription.status": "past_due" } },
      );
      break;
    }
  }
}
