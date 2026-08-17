/**
 * Stripe integration — entity subscription checkout, portal, and webhooks.
 *
 * Customer is the owning User; subscription metadata carries entityType + entityId.
 * Prices come from the entity's persisted monthlyPriceCents (catalog default at create).
 */

import Stripe from "stripe";
import User from "@/models/User.ts";
import Stable from "@/models/Stable.ts";
import { ownedByUserQuery } from "@/lib/ownership/entityOwnership.ts";
import type { BillingCurrencyCode } from "./entityCatalog.ts";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key, {});
}

const STRIPE_STABLE_PRODUCT_ID = process.env.STRIPE_PRODUCT_STABLE || "";

function stableBillingReturnUrl(stableId: string): string {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return `${base}/stables/${stableId}/admin`;
}

async function loadOwnedStable(stableId: string, userId: string) {
  const stable = await Stable.findOne({ _id: stableId, ...ownedByUserQuery(userId) });
  if (!stable) throw new Error("Stable not found or access denied");
  return stable;
}

export async function createEntityCheckoutSession(
  userId: string,
  stableId: string,
  currency: BillingCurrencyCode = "EUR",
) {
  const user = await User.findById(userId).select("email subscription.stripeCustomerId");
  if (!user) throw new Error("User not found");

  const stable = await loadOwnedStable(stableId, userId);
  const sub = stable.subscription ?? {};
  const amount = sub.monthlyPriceCents;
  if (!amount || amount <= 0) throw new Error("No price configured for this stable");

  if (!STRIPE_STABLE_PRODUCT_ID) throw new Error("STRIPE_PRODUCT_STABLE is not configured");

  const price = await getStripe().prices.create({
    unit_amount: amount,
    currency: (sub.currency ?? currency).toLowerCase(),
    product: STRIPE_STABLE_PRODUCT_ID,
    recurring: { interval: "month" },
  });

  const existingCustomerId =
    sub.stripeCustomerId ?? user.subscription?.stripeCustomerId ?? undefined;

  const session = await getStripe().checkout.sessions.create({
    customer: existingCustomerId,
    customer_email: existingCustomerId ? undefined : user.email,
    mode: "subscription",
    line_items: [{ price: price.id, quantity: 1 }],
    success_url: `${stableBillingReturnUrl(stableId)}?billing=success`,
    cancel_url: `${stableBillingReturnUrl(stableId)}?billing=canceled`,
    metadata: {
      userId,
      entityType: "stable",
      entityId: stableId,
    },
    subscription_data: {
      metadata: {
        userId,
        entityType: "stable",
        entityId: stableId,
      },
    },
    allow_promotion_codes: true,
  });

  return { url: session.url };
}

export async function createEntityPortalSession(userId: string, stableId: string) {
  const stable = await loadOwnedStable(stableId, userId);
  const customerId = stable.subscription?.stripeCustomerId;
  if (!customerId) throw new Error("No Stripe customer for this stable");

  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: stableBillingReturnUrl(stableId),
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

async function updateStableSubscriptionFromStripe(
  stableId: string,
  updates: Record<string, unknown>,
): Promise<void> {
  await Stable.findByIdAndUpdate(stableId, { $set: updates });
}

export async function handleSubscriptionWebhook(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const { userId, entityType, entityId } = session.metadata || {};
      if (entityType !== "stable" || !entityId || !userId) break;

      await updateStableSubscriptionFromStripe(entityId, {
        "subscription.status": "active",
        "subscription.stripeCustomerId": session.customer as string,
        "subscription.stripeSubscriptionId": session.subscription as string,
        "subscription.currentPeriodStart": new Date(),
        "subscription.currentPeriodEnd": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      if (session.customer) {
        await User.findByIdAndUpdate(userId, {
          $set: { "subscription.stripeCustomerId": session.customer as string },
        });
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as SubscriptionWithPeriod;
      const stable = await Stable.findOne({
        "subscription.stripeSubscriptionId": sub.id,
      });
      if (!stable) break;

      const status =
        sub.status === "active"
          ? "active"
          : sub.status === "past_due"
            ? "past_due"
            : sub.status === "canceled" || sub.status === "unpaid"
              ? "write_locked"
              : sub.status;

      const updates: Record<string, unknown> = {
        "subscription.status": status,
        "subscription.currentPeriodStart": new Date(sub.current_period_start * 1000),
        "subscription.currentPeriodEnd": new Date(sub.current_period_end * 1000),
      };

      if (status === "write_locked" || status === "canceled") {
        updates["subscription.canceledAt"] = new Date();
      }

      await Stable.findByIdAndUpdate(stable._id, { $set: updates });
      break;
    }
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as InvoiceWithSubscription;
      const subId = invoice.subscription;
      await Stable.findOneAndUpdate(
        { "subscription.stripeSubscriptionId": subId },
        { $set: { "subscription.status": "active" } },
      );
      break;
    }
    case "invoice.payment_failed": {
      const failedInvoice = event.data.object as InvoiceWithSubscription;
      await Stable.findOneAndUpdate(
        { "subscription.stripeSubscriptionId": failedInvoice.subscription },
        { $set: { "subscription.status": "past_due" } },
      );
      break;
    }
  }
}

export async function getStableBillingForOwner(userId: string, stableId: string) {
  const stable = await loadOwnedStable(stableId, userId);
  const { buildStableBillingDto } = await import("./entitySubscription.ts");
  return buildStableBillingDto(stableId, stable.subscription ?? {});
}
