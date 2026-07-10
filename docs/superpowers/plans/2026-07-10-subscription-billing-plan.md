# Equus Subscription Billing System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace per-horse billing with a user-tier subscription model (Free/Bronze/Silver/Gold/Diamond) with Stripe integration, multi-currency pricing, discounts, and enforcement guards.

**Architecture:** A `lib/billing/` directory with plan config, horse counting, subscription guards, and Stripe helpers. User model gets a `subscription` embed. Horse subscription embed is simplified. Stripe webhooks sync subscription status. API routes expose checkout, portal, and current plan. Frontend subscription page + popup modals enforce limits.

**Tech Stack:** Next.js 16, Mongoose, Stripe SDK, TypeScript

## Global Constraints

- Only count ACTIVE horses where `mainOwnerUserId == userId AND registration.isActive == true`
- Co-ownership (`coOwners[].userId`) excluded from limit
- All prices stored in cents in config
- Stripe handles recurring billing, proration, and payment method storage
- Discounts applied via Stripe Coupons
- No credit card numbers stored in our database
- Default subscription: Free tier, status "trial"
- Payment gating: past_due subscriptions block horse data access after grace period
- Follow existing codebase patterns (models, services, routes)
- `dateOfDeath` set → horse automatically becomes inactive

---

### Task 1: Update documentation

**Files:**
- Modify: `documentation/businessPlan.md` (Section 11 — monetization)
- Create: `documentation/billing.md`

Content for businessPlan.md Section 11 update:
- Replace "$99/horse/month" text with the new tier model
- Add tier table: Free (1 horse, $0), Bronze (3 horses, $89-$11,900 p/m), Silver (5 horses, $149-$21,900), Gold (8 horses, $219-$31,900), Diamond (unlimited, $329-$47,900)
- Add "region-based pricing" note (prices per market, not exchange rate)
- Keep: 30-day trial, business accounts free, referral commissions
- Add: subscription enforcement rules

Content for billing.md:
- Architecture overview (layers diagram)
- Tier config reference (how to add/edit plans and prices)
- Stripe setup guide (products, prices, webhooks, env vars)
- Discount system (how to apply per-user discounts)
- Admin operations reference (DB commands for discounts, manual tier changes)
- Webhook event reference (which Stripe events update what)
- FAQ / troubleshooting

- [ ] **Step 1: Commit doc changes**

```bash
git add documentation/businessPlan.md documentation/billing.md
git commit -m "docs: update monetization model and add billing documentation"
```

---

### Task 2: Create lib/billing/plans.ts — tier config

**Files:**
- Create: `lib/billing/plans.ts`

```typescript
export type TierId = "free" | "bronze" | "silver" | "gold" | "diamond";
export type CurrencyCode = "USD" | "EUR" | "GBP" | "BRL" | "CAD" | "AUD" | "CHF" | "JPY";

export interface SubscriptionPlan {
  id: TierId;
  name: string;
  horseLimit: number;
  prices: Record<CurrencyCode, number>;
  description: string;
}

export const SUBSCRIPTION_PLANS: Record<TierId, SubscriptionPlan> = {
  free: {
    id: "free", name: "Free", horseLimit: 1,
    prices: { USD: 0, EUR: 0, GBP: 0, BRL: 0, CAD: 0, AUD: 0, CHF: 0, JPY: 0 },
    description: "Perfect for trying out the platform with one horse.",
  },
  bronze: {
    id: "bronze", name: "Bronze", horseLimit: 3,
    prices: { USD: 8900, EUR: 7900, GBP: 6900, BRL: 34900, CAD: 11900, AUD: 12900, CHF: 7900, JPY: 980000 },
    description: "For owners with 2-3 horses.",
  },
  silver: {
    id: "silver", name: "Silver", horseLimit: 5,
    prices: { USD: 14900, EUR: 13900, GBP: 11900, BRL: 54900, CAD: 19900, AUD: 21900, CHF: 13900, JPY: 1500000 },
    description: "For committed owners with up to 5 horses.",
  },
  gold: {
    id: "gold", name: "Gold", horseLimit: 8,
    prices: { USD: 21900, EUR: 19900, GBP: 17900, BRL: 79900, CAD: 29900, AUD: 31900, CHF: 19900, JPY: 2200000 },
    description: "For serious competitors and semi-professionals.",
  },
  diamond: {
    id: "diamond", name: "Diamond", horseLimit: Infinity,
    prices: { USD: 32900, EUR: 29900, GBP: 26900, BRL: 119900, CAD: 43900, AUD: 47900, CHF: 29900, JPY: 3500000 },
    description: "Unlimited horses for professionals and breeders.",
  },
};

export function getPlan(tierId: TierId): SubscriptionPlan {
  const plan = SUBSCRIPTION_PLANS[tierId];
  if (!plan) throw new Error(`Unknown tier: ${tierId}`);
  return plan;
}

export function getPlanByHorseCount(count: number): TierId {
  const tiers: [TierId, number][] = [
    ["diamond", Infinity],
    ["gold", 8],
    ["silver", 5],
    ["bronze", 3],
    ["free", 1],
  ];
  for (const [tierId, limit] of tiers) {
    if (count <= limit) return tierId;
  }
  return "diamond";
}

export function getEffectivePrice(tierId: TierId, currency: CurrencyCode, discountPercent: number): number {
  const plan = getPlan(tierId);
  const basePrice = plan.prices[currency];
  if (!basePrice) throw new Error(`No price for ${currency} in ${tierId}`);
  if (discountPercent <= 0) return basePrice;
  return Math.round(basePrice * (1 - discountPercent / 100));
}

export const tierEnums = ["free", "bronze", "silver", "gold", "diamond"] as const;
```

- [ ] **Step 1: Commit**

```bash
git add lib/billing/plans.ts
git commit -m "feat(billing): add subscription plan config and helpers"
```

---

### Task 3: Update User model — add subscription embed

**Files:**
- Modify: `models/User.ts`

Add `import { tierEnums } from "@/lib/billing/plans.ts";`

Add to the user schema before timestamps:

```typescript
subscription: {
  tier: { type: String, enum: tierEnums, default: "free" },
  status: {
    type: String,
    enum: ["trial", "active", "past_due", "canceled", "incomplete"],
    default: "trial",
  },
  stripeCustomerId: { type: String },
  stripeSubscriptionId: { type: String },
  trialEndsAt: { type: Date },
  currentPeriodStart: { type: Date },
  currentPeriodEnd: { type: Date },
  currency: {
    type: String,
    enum: ["USD", "EUR", "GBP", "BRL", "CAD", "AUD", "CHF", "JPY"],
    default: "USD",
  },
  discountPercentage: { type: Number, default: 0, min: 0, max: 100 },
  discountValidUntil: { type: Date },
  canceledAt: { type: Date },
},
```

- [ ] **Step 1: Commit**

```bash
git add models/User.ts
git commit -m "feat(billing): add subscription embed to User model"
```

---

### Task 4: Update Horse model — registration embed with lifecycle + payment gating

**Files:**
- Modify: `models/Horse.ts`

Replace the existing `horseSubscriptionSchema` with a richer registration embed that includes lifecycle and payment-gating fields:

```typescript
// Remove old:
// horseSubscriptionSchema = { status, monthlyFee, currency, trialStartedAt, ... }

// Add new:
const horseRegistrationSchema = new Schema({
  addedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  dateOfDeath: { type: Date, default: null },
  dataAvailability: {
    type: String,
    enum: ["available", "payment_blocked"],
    default: "available",
  },
  payerUserId: { type: Schema.Types.ObjectId, ref: "User" },
  // Commission tracking
  attributedAccountType: { type: String, enum: accountTypeEnums },
  attributedAccountId: { type: Schema.Types.ObjectId },
  referralReference: { type: String },
  commissionEligibleUntil: { type: Date },
}, { _id: false });
```

Then update the Horse schema field from `subscription: { type: horseSubscriptionSchema, ... }` to `registration: { type: horseRegistrationSchema, ... }`.

Also update `horseService.ts` where the subscription embed is initialized during horse creation (line ~162):
```typescript
// Old:
subscription: { status: "trial", monthlyFee: 99, currency: "USD", payerUserId: actorUserId },
// New:
registration: { addedAt: new Date(), isActive: true, dataAvailability: "available", payerUserId: actorUserId },
```

And update `lib/horses/horseSubscriptionBilling.ts`:
- Rename file to `lib/horses/horseRegistration.ts` (or keep name but update internals)
- Update `assignInitialHorseSubscriptionPayer` → `assignInitialHorsePayer`
- Update `reassignHorseSubscriptionPayerAfterTransferMain` → `reassignHorsePayerAfterTransferMain`

- [ ] **Step 1: Commit**

```bash
git add models/Horse.ts lib/services/horseService.ts lib/horses/horseSubscriptionBilling.ts
git commit -m "feat(billing): update horse registration embed with lifecycle and payment gating"
```

---

### Task 5: Create lib/billing/horseCounter.ts

**Files:**
- Create: `lib/billing/horseCounter.ts`

```typescript
import mongoose from "mongoose";
import Horse from "@/models/Horse.ts";
import User from "@/models/User.ts";
import { getPlan, type TierId } from "./plans.ts";

export async function countUserOwnedHorses(userId: string): Promise<number> {
  return Horse.countDocuments({
    mainOwnerUserId: new mongoose.Types.ObjectId(userId),
    "registration.isActive": true,
  });
}

export async function getUserHorseUsage(userId: string): Promise<{
  current: number;
  limit: number;
  tierId: TierId;
  remaining: number;
}> {
  const user = await User.findById(userId).select("subscription.tier").lean();
  if (!user) throw new Error("User not found");
  const plan = getPlan(user.subscription.tier as TierId);
  const current = await countUserOwnedHorses(userId);
  return {
    current,
    limit: plan.horseLimit,
    tierId: plan.id,
    remaining: plan.horseLimit === Infinity ? Infinity : plan.horseLimit - current,
  };
}

export async function canUserAddHorse(userId: string): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
  requiredTier: TierId | null;
}> {
  const usage = await getUserHorseUsage(userId);
  if (usage.remaining > 0) {
    return { allowed: true, current: usage.current, limit: usage.limit, requiredTier: null };
  }
  // Find the minimum tier that would allow another horse
  const requiredTier = getPlanByHorseCount(usage.current + 1);
  return { allowed: false, current: usage.current, limit: usage.limit, requiredTier };
}
```

- [ ] **Step 1: Commit**

```bash
git add lib/billing/horseCounter.ts
git commit -m "feat(billing): add horse counting and usage check service"
```

---

### Task 6: Create lib/billing/subscriptionGuard.ts

**Files:**
- Create: `lib/billing/subscriptionGuard.ts`

```typescript
import { canUserAddHorse, getUserHorseUsage } from "./horseCounter.ts";
import { getPlan, getPlanByHorseCount, type TierId } from "./plans.ts";

export async function guardHorseCreation(userId: string) {
  const result = await canUserAddHorse(userId);
  if (result.allowed) return { ok: true as const };
  return {
    ok: false as const,
    code: "HORSE_LIMIT_REACHED" as const,
    current: result.current,
    limit: result.limit,
    requiredTier: result.requiredTier,
  };
}

export async function guardPlanDowngrade(userId: string, newTier: TierId) {
  const usage = await getUserHorseUsage(userId);
  const plan = getPlan(newTier);
  if (usage.current <= plan.horseLimit) return { ok: true as const };
  const excess = usage.current - plan.horseLimit;
  return {
    ok: false as const,
    code: "DOWNGRADE_EXCEEDS_LIMIT" as const,
    reason: `You have ${usage.current} horses. ${plan.name} allows ${plan.horseLimit}. Remove or transfer ${excess} horse(s) before downgrading.`,
    excess,
  };
}

export async function guardAcceptTransfer(userId: string) {
  const result = await canUserAddHorse(userId);
  if (result.allowed) return { ok: true as const };
  return {
    ok: false as const,
    code: "TRANSFER_EXCEEDS_LIMIT" as const,
    current: result.current,
    limit: result.limit,
    requiredTier: result.requiredTier,
  };
}
```

- [ ] **Step 1: Commit**

```bash
git add lib/billing/subscriptionGuard.ts
git commit -m "feat(billing): add subscription enforcement guards"
```

---

### Task 7: Create lib/billing/stripe.ts — Stripe SDK setup

**Files:**
- Create: `lib/billing/stripe.ts`

```typescript
import Stripe from "stripe";
import { getPlan, SUBSCRIPTION_PLANS, type TierId, type CurrencyCode, tierEnums } from "./plans.ts";
import User from "@/models/User.ts";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24",
});

const STRIPE_PRICE_IDS: Record<TierId, Record<CurrencyCode, string>> = {
  free:    { USD: "", EUR: "", GBP: "", BRL: "", CAD: "", AUD: "", CHF: "", JPY: "" },
  bronze:  { USD: process.env.STRIPE_PRICE_BRONZE_USD!, EUR: process.env.STRIPE_PRICE_BRONZE_EUR!, /* ... */ },
  silver:  { USD: process.env.STRIPE_PRICE_SILVER_USD!, /* ... */ },
  gold:    { USD: process.env.STRIPE_PRICE_GOLD_USD!, /* ... */ },
  diamond: { USD: process.env.STRIPE_PRICE_DIAMOND_USD!, /* ... */ },
};

export async function createCheckoutSession(userId: string, tierId: TierId, currency: CurrencyCode) {
  const user = await User.findById(userId).select("subscription.stripeCustomerId email");
  if (!user) throw new Error("User not found");

  const priceId = STRIPE_PRICE_IDS[tierId][currency];
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

export async function handleSubscriptionWebhook(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const { userId, tierId } = session.metadata!;
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
      const sub = event.data.object;
      const user = await User.findOne({ "subscription.stripeSubscriptionId": sub.id });
      if (!user) break;
      const updates: Record<string, unknown> = {
        "subscription.status": sub.status === "active" ? "active"
          : sub.status === "past_due" ? "past_due"
          : sub.status === "canceled" ? "canceled"
          : sub.status,
        "subscription.currentPeriodStart": new Date(sub.current_period_start * 1000),
        "subscription.currentPeriodEnd": new Date(sub.current_period_end * 1000),
      };
      if (sub.status === "canceled" || sub.status === "incomplete_expired") {
        updates["subscription.tier"] = "free";
        updates["subscription.canceledAt"] = new Date();
      }
      await User.findByIdAndUpdate(user._id, { $set: updates });
      break;
    }
    case "invoice.payment_succeeded": {
      const invoice = event.data.object;
      const subId = invoice.subscription as string;
      await User.findOneAndUpdate(
        { "subscription.stripeSubscriptionId": subId },
        { $set: { "subscription.status": "active" } },
      );
      break;
    }
    case "invoice.payment_failed": {
      const failedInvoice = event.data.object;
      const failedSubId = failedInvoice.subscription as string;
      await User.findOneAndUpdate(
        { "subscription.stripeSubscriptionId": failedSubId },
        { $set: { "subscription.status": "past_due" } },
      );
      break;
    }
  }
}
```

Note: Include all currency env vars for each tier in the `STRIPE_PRICE_IDS` map. The env vars must be set up in the Stripe dashboard first.

- [ ] **Step 1: Commit**

```bash
git add lib/billing/stripe.ts
git commit -m "feat(billing): add Stripe integration (checkout, portal, webhooks)"
```

---

### Task 8: Create billing API routes

**Files:**
- Create: `app/api/v1/billing/create-checkout/route.ts`
- Create: `app/api/v1/billing/portal/route.ts`
- Create: `app/api/v1/billing/webhook/route.ts`
- Create: `app/api/v1/billing/current/route.ts`

Each file follows the existing pattern from other API routes in `app/api/v1/`.

**create-checkout/route.ts:**
```typescript
import { NextRequest } from "next/server";
import { createCheckoutSession } from "@/lib/billing/stripe.ts";
import { ok, fail } from "@/lib/api/response.ts";
import { requireSession } from "@/lib/auth/establishSession.ts";

export async function POST(req: NextRequest) {
  const session = await requireSession();
  const body = await req.json();
  const { tierId, currency } = body;
  try {
    const result = await createCheckoutSession(session.userId, tierId, currency);
    return ok(result);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to create checkout");
  }
}
```

**portal/route.ts:**
```typescript
export async function POST() {
  const session = await requireSession();
  const result = await createPortalSession(session.userId);
  return ok(result);
}
```

**webhook/route.ts:**
```typescript
import { NextRequest } from "next/server";
import Stripe from "stripe";
import { handleSubscriptionWebhook } from "@/lib/billing/stripe.ts";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature")!;
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }
  await handleSubscriptionWebhook(event);
  return new Response("OK", { status: 200 });
}
```

**current/route.ts:**
```typescript
export async function GET() {
  const session = await requireSession();
  const usage = await getUserHorseUsage(session.userId);
  return ok(usage);
}
```

- [ ] **Step 1: Commit**

```bash
git add app/api/v1/billing/
git commit -m "feat(billing): add billing API routes (checkout, portal, webhook, current)"
```

---

### Task 9: Inject subscription guards into horse creation (+ banner + popup flow)

**Files:**
- Modify: `lib/services/horseService.ts`
- Create: `lib/billing/errors.ts` or modify: `lib/api/errors.ts`

In the `createHorse` function (around line 153), add a subscription guard check before creating the horse:

```typescript
import { guardHorseCreation } from "@/lib/billing/subscriptionGuard.ts";

export async function createHorse(actorUserId: string, input: CreateHorseInput) {
  // --- ADD: Subscription guard ---
  const guard = await guardHorseCreation(actorUserId);
  if (!guard.ok) {
    throw new HorseLimitError({
      code: guard.code,
      current: guard.current,
      limit: guard.limit,
      requiredTier: guard.requiredTier,
    });
  }
  // --- End guard ---

  // ... rest of existing createHorse logic ...
}
```

Create a new error class:
```typescript
// lib/billing/errors.ts or add to lib/api/errors.ts
export class HorseLimitError extends ApiError {
  constructor(details: { code: string; current: number; limit: number; requiredTier: string | null }) {
    super(403, details.code, details);
  }
}
```

Also update the horse creation's registration initialization:
```typescript
// Old:
subscription: { status: "trial", monthlyFee: 99, currency: "USD", payerUserId: actorUserId },
// New:
registration: { addedAt: new Date(), isActive: true, dataAvailability: "available", payerUserId: actorUserId },
```

**Frontend flow (horse creation page):**
1. When the "Add Horse" page loads, fetch `GET /api/v1/billing/current` to get horse limit info
2. If `remaining <= 0`, show a **banner at the top of the page** (like the incomplete-profile banner):
   > "You've reached your Free limit of 1 horse. Upgrade to add more horses."
3. User can still fill the form fields normally
4. On "Save" click:
   - If at limit: show a **popup/modal**:
     > "You've reached your {tier} limit of {limit} horses. Upgrade to {requiredTier} ({price}/mo) to add more horses."
     > [Upgrade & Create] → redirects to Stripe Checkout → webhook updates tier → retry creation
     > [Cancel]
   - If within limit: create horse normally

- [ ] **Step 1: Commit**

```bash
git add lib/services/horseService.ts lib/api/errors.ts
git commit -m "feat(billing): add subscription guard to horse creation"
```

---

### Task 10: Inject subscription guard into ownership transfer acceptance

**Files:**
- Modify: `lib/services/ownershipTransferService.ts`

**Important rule:** The horse stays under the PREVIOUS owner's ownership until the new owner explicitly accepts the transfer. Only on acceptance do we check the new owner's subscription limit.

In the function that processes transfer acceptance (when the receiving user clicks "Accept"), add a guard:

```typescript
import { guardAcceptTransfer } from "@/lib/billing/subscriptionGuard.ts";

// Before applying the transfer (changing mainOwnerUserId):
const guard = await guardAcceptTransfer(newOwnerUserId);
if (!guard.ok) {
  throw new HorseLimitError({
    code: guard.code,
    current: guard.current,
    limit: guard.limit,
    requiredTier: guard.requiredTier,
  });
}
// If guard passes, proceed with transfer
```

**Frontend flow:**
1. User receives transfer notification (in-app + email): "Owner A wants to transfer Horse X to you"
2. User clicks "Accept"
3. If subscription has room: transfer proceeds, horse moves to new owner
4. If no room: popup shows
   > "Accepting this horse would exceed your {tier} limit of {limit} horses. Upgrade to {requiredTier} to accept."
   > [Upgrade & Accept] → Checkout → webhook → retry accept
   > [Decline] → transfer declined, horse stays with original owner

- [ ] **Step 1: Commit**

```bash
git add lib/services/ownershipTransferService.ts
git commit -m "feat(billing): add subscription guard to ownership transfer"
```

---

### Task 11: Payment gating — data availability enforcement

**Files:**
- Create: `lib/billing/paymentGate.ts`
- Modify: `lib/billing/stripe.ts` (add payment_blocked logic to webhook handler)

**Logic:**

```typescript
// lib/billing/paymentGate.ts
const GRACE_PERIOD_DAYS = 14; // Configurable

export async function applyPaymentGate(userId: string) {
  const user = await User.findById(userId).select("subscription.status subscription.currentPeriodEnd").lean();
  if (!user || user.subscription?.status !== "past_due") return;

  const overGracePeriod = user.subscription.currentPeriodEnd
    ? Date.now() > user.subscription.currentPeriodEnd.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
    : false;

  if (overGracePeriod) {
    // Block data access for all user's active horses
    await Horse.updateMany(
      { mainOwnerUserId: userId, "registration.isActive": true },
      { $set: { "registration.dataAvailability": "payment_blocked" } },
    );
  }
}

export async function restorePaymentAccess(userId: string) {
  await Horse.updateMany(
    { mainOwnerUserId: userId },
    { $set: { "registration.dataAvailability": "available" } },
  );
}
```

**Webhook integration** (in `stripe.ts`, inside the existing webhook handler):

```typescript
// In invoice.payment_failed case:
case "invoice.payment_failed": {
  const invoice = event.data.object;
  const subId = invoice.subscription as string;
  await User.findOneAndUpdate(
    { "subscription.stripeSubscriptionId": subId },
    { $set: { "subscription.status": "past_due" } },
  );
  break;
}

// In invoice.payment_succeeded case (UPDATE existing):
case "invoice.payment_succeeded": {
  const invoice = event.data.object;
  const subId = invoice.subscription as string;
  const user = await User.findOneAndUpdate(
    { "subscription.stripeSubscriptionId": subId },
    { $set: { "subscription.status": "active" } },
  ).select("_id");
  if (user) await restorePaymentAccess(user._id.toString());  // Restore access
  break;
}
```

**On-access middleware check** (optional — for real-time gating):
On any API route that returns horse data, check `horse.registration.dataAvailability`:
- If `payment_blocked`, return only basic info (name, breed, photo), block detailed data (medical, training, documents, invoices)

- [ ] **Step 1: Commit**

```bash
git add lib/billing/paymentGate.ts lib/billing/stripe.ts
git commit -m "feat(billing): add payment gating for overdue subscriptions"
```

---

### Task 12: Create subscription page UI

**Files:**
- Create: `app/[locale]/subscription/page.tsx`
- Create: `components/billing/subscription-page-content.tsx`

**page.tsx:**
```typescript
import { Suspense } from "react";
import type { Metadata } from "next";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";
import { SubscriptionPageContent } from "@/components/billing/subscription-page-content.tsx";
import { SubscriptionPageSkeleton } from "@/components/billing/subscription-page-skeleton.tsx";

type PageProps = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/subscription", "metadata.subscription");
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<SubscriptionPageSkeleton />}>
      <SubscriptionPageContent />
    </Suspense>
  );
}
```

**subscription-page-content.tsx** (Client Component):
- Fetches `GET /api/v1/billing/current` for current plan + usage
- Shows current plan card with usage bar (X of Y horses)
- Lists all plans in a grid/table format with prices
- "Current plan" indicator on the active tier
- "Upgrade" / "Downgrade" buttons → redirects to Stripe Checkout or Portal
- "Update payment method" → redirects to Stripe Customer Portal
- Billing history link → redirects to Stripe Customer Portal

Key implementation details:
```typescript
"use client";
import { useQuery } from "@tanstack/react-query";
import { useAppAuth } from "@/hooks/use-app-auth";
import { SUBSCRIPTION_PLANS } from "@/lib/billing/plans";

export function SubscriptionPageContent() {
  const { data: billing, isPending } = useQuery({
    queryKey: ["billing", "current"],
    queryFn: () => fetch("/api/v1/billing/current").then(r => r.json()),
  });

  async function handleUpgrade(tierId: string) {
    const res = await fetch("/api/v1/billing/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tierId, currency: "USD" }),
    });
    const { url } = await res.json();
    window.location.href = url;
  }

  async function handlePortal() {
    const res = await fetch("/api/v1/billing/portal", { method: "POST" });
    const { url } = await res.json();
    window.location.href = url;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Current plan summary */}
      <section className="mb-8">
        <h1>Subscription</h1>
        <p>Current plan: {billing?.tierId}</p>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div className="bg-primary h-4 rounded-full"
               style={{ width: `${(billing?.current / billing?.limit) * 100}%` }} />
        </div>
        <p>{billing?.current} of {billing?.limit === Infinity ? "∞" : billing?.limit} horses</p>
      </section>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
          <div key={plan.id} className={`border rounded-lg p-4 ${billing?.tierId === plan.id ? 'ring-2 ring-primary' : ''}`}>
            <h2>{plan.name}</h2>
            <p className="text-2xl font-bold">${(plan.prices.USD / 100).toFixed(0)}<span className="text-sm font-normal">/mo</span></p>
            <p>{plan.horseLimit === Infinity ? "Unlimited" : plan.horseLimit} horses</p>
            <p className="text-sm text-muted-foreground">{plan.description}</p>
            {billing?.tierId === plan.id ? (
              <button onClick={handlePortal} className="btn-secondary">Manage</button>
            ) : (
              <button onClick={() => handleUpgrade(plan.id)}
                      disabled={isPending}
                      className="btn-primary">
                {billing?.tierId === "free" ? "Subscribe" : "Change"}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Payment & billing */}
      <section className="mt-8">
        <button onClick={handlePortal} className="btn-secondary">Update payment method</button>
        <button onClick={handlePortal} className="btn-secondary ml-2">View billing history</button>
      </section>
    </div>
  );
}
```

Also add skeleton loading state component:
```typescript
// components/billing/subscription-page-skeleton.tsx
export function SubscriptionPageSkeleton() {
  return <div className="max-w-4xl mx-auto p-6 animate-pulse">{/* skeleton UI */}</div>;
}
```

Also add the metadata translation key for the new page:
```json
// messages/en.json + messages/es.json
"subscription": {
  "title": "Subscription | Equus",
  "description": "Manage your Equus subscription plan."
}
```

- [ ] **Step 1: Commit**

```bash
git add app/[locale]/subscription/ components/billing/ messages/en.json messages/es.json
git commit -m "feat(billing): add subscription management page"
```

---

### Task 13: Add tierEnums to utils/enums.ts (if needed)

**Files:**
- Check: `utils/enums.ts`

If `tierEnums` doesn't exist yet in enums, add it:
```typescript
export const tierEnums = ["free", "bronze", "silver", "gold", "diamond"] as const;
```

- [ ] **Step 1: Commit (if needed)**

```bash
git add utils/enums.ts
git commit -m "chore: add tierEnums to shared enums"
```

---

### Task 14: Add metadata translation for subscription page

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/es.json`

Add to the metadata namespace:
```json
"subscription": {
  "title": "Subscription | Equus",
  "description": "Manage your Equus subscription plan and billing.",
  "keywords": ""
}
```

Spanish:
```json
"subscription": {
  "title": "Suscripción | Equus",
  "description": "Gestiona tu plan de suscripción y facturación de Equus.",
  "keywords": ""
}
```

- [ ] **Step 1: Commit**

```bash
git add messages/en.json messages/es.json
git commit -m "feat: add subscription page metadata translations"
```

---

### Task 15: Final build verification

- [ ] **Step 1: Build the project**

```bash
npm run build
```

Expected: Successful build with no errors.

- [ ] **Step 2: Verify all new routes and pages**
- GET /subscription loads the subscription page
- POST /api/v1/billing/current returns user's plan
- POST /api/v1/billing/create-checkout returns a Stripe URL (or handles missing env vars gracefully)
- POST /api/v1/billing/portal returns a Stripe URL
- Horse creation respects subscription limit
- Ownership transfer respects subscription limit
