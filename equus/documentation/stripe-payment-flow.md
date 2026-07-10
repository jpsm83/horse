# Stripe Payment & Subscription Flow

**Last updated:** 2026-07-10

---

## Overview

This document explains how Stripe integrates with Equus for the user-tier subscription model. Payments are handled entirely by Stripe — we never see or store credit card numbers.

**Key principle:** Prices are defined in `lib/billing/plans.ts` (hardcoded). Stripe Products are created once in the Stripe Dashboard. Stripe Prices are created **dynamically** at checkout from the hardcoded values — no Price IDs in env vars.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
│  Subscription page → "Upgrade" button                       │
│      ↓ POST /api/v1/billing/create-checkout                 │
│      ↓ receives { url } → redirects to Stripe               │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              API Routes (Next.js Route Handlers)             │
│                                                              │
│  /create-checkout  → createCheckoutSession()                 │
│                      → Creates Stripe Price from plans.ts    │
│                      → Creates Stripe Checkout Session       │
│                      → Returns { url }                       │
│                                                              │
│  /portal           → createPortalSession()                   │
│                      → Creates Stripe Customer Portal URL    │
│                      → Returns { url }                       │
│                                                              │
│  /webhook          → handleSubscriptionWebhook()             │
│                      → Syncs subscription status to User     │
│                                                              │
│  /current          → getUserHorseUsage()                     │
│                      → Returns plan + horse count info       │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                   lib/billing/ (Services)                    │
│                                                              │
│  stripe.ts           → Stripe SDK, checkout, portal, webhook │
│  plans.ts            → Tier config (hardcoded prices)       │
│  horseCounter.ts     → Count user's active horses           │
│  subscriptionGuard.ts→ Enforcement (creation, transfer)      │
│  paymentGate.ts      → Block/restore data access            │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                      Stripe (external)                       │
│                                                              │
│  Products: Bronze, Silver, Gold, Diamond (created once)      │
│  Prices: Created dynamically per checkout                    │
│  Subscriptions: Recurring monthly billing                    │
│  Customer Portal: User manages payment/cancel                │
└─────────────────────────────────────────────────────────────┘
```

---

## Files & Responsibilities

| File | Role |
|------|------|
| `lib/billing/stripe.ts` | Stripe SDK initialization, checkout/portal/webhook functions |
| `lib/billing/plans.ts` | Tier definitions: name, horse limit, prices per currency |
| `lib/billing/horseCounter.ts` | Count active horses for a user |
| `lib/billing/subscriptionGuard.ts` | Validate horse creation & transfer against plan limits |
| `lib/billing/paymentGate.ts` | Block horse data when subscription is past_due |
| `app/api/v1/billing/create-checkout/route.ts` | POST endpoint — returns Stripe Checkout URL |
| `app/api/v1/billing/portal/route.ts` | POST endpoint — returns Stripe Customer Portal URL |
| `app/api/v1/billing/webhook/route.ts` | POST endpoint — receives Stripe webhooks |
| `app/api/v1/billing/current/route.ts` | GET endpoint — returns user's plan + horse usage |
| `app/[locale]/subscription/page.tsx` | UI page — plan selection, usage bar |
| `components/billing/subscription-page-content.tsx` | Client component with plan cards |

---

## Key Flows

### 1. Subscription Purchase (New User)

```
User clicks "Subscribe" on Bronze/Silver/Gold/Diamond
  ↓
Frontend calls POST /api/v1/billing/create-checkout
  Body: { tierId: "bronze", currency: "USD" }
  ↓
createCheckoutSession() in stripe.ts:
  1. Gets plan from plans.ts → amount = 8900 ($89)
  2. Creates Stripe Price: { unit_amount: 8900, currency: "usd",
     product: STRIPE_PRODUCT_BRONZE, recurring: { interval: "month" } }
  3. Creates Stripe Checkout Session with that Price
  ↓
Returns { url: "https://checkout.stripe.com/..." }
  ↓
Frontend redirects user to Stripe Checkout
  ↓
User enters card info on Stripe-hosted page
  ↓
Stripe processes payment, creates Subscription
  ↓
Stripe sends webhook: checkout.session.completed
  ↓
handleSubscriptionWebhook() in stripe.ts:
  Updates User.subscription:
    tier = "bronze"
    status = "active"
    stripeCustomerId = "cus_xxx"
    stripeSubscriptionId = "sub_xxx"
    currentPeriodStart = now
    currentPeriodEnd = now + 30 days
  ↓
User is now on Bronze plan with access to 3 horse slots
```

### 2. Recurring Monthly Billing

```
Stripe automatically charges the saved payment method every 30 days
  ↓
Stripe sends webhook: invoice.payment_succeeded
  ↓
handleSubscriptionWebhook():
  Updates User.subscription.status = "active"
  Calls restorePaymentAccess(userId) → ensures data is available
  ↓
(If payment fails, webhook: invoice.payment_failed)
  ↓
handleSubscriptionWebhook():
  Sets User.subscription.status = "past_due"
  ↓
After 14-day grace period, applyPaymentGate() blocks horse data access
```

### 3. Plan Change (Upgrade/Downgrade)

```
User goes to Stripe Customer Portal (via /portal endpoint)
  ↓
Stripe Portal shows current plan, available plans
  ↓
User selects new plan
  ↓
Stripe handles proration automatically:
  - Upgrade: charges prorated difference for remaining days
  - Downgrade: credits unused time, applies to next invoice
  ↓
Stripe sends webhook: customer.subscription.updated
  ↓
handleSubscriptionWebhook():
  Syncs subscription.status, currentPeriod dates
  Updates tier if the plan changed
```

### 4. Cancel Subscription

```
User goes to Stripe Customer Portal → "Cancel subscription"
  ↓
Stripe sets subscription to "canceled" (access continues until period end)
  ↓
Stripe sends webhook: customer.subscription.deleted
  ↓
handleSubscriptionWebhook():
  Sets User.subscription.tier = "free"
  Sets User.subscription.status = "canceled"
  Sets User.subscription.canceledAt = now
  ↓
User is downgraded to Free tier (1 horse limit)
  If user has more than 1 horse → cannot add new ones
  until they upgrade or transfer/remove horses
```

### 5. Subscription Enforcement (Horse Creation)

```
User tries to create a horse (POST /api/v1/horses)
  ↓
horseService.createHorse() calls guardHorseCreation(userId)
  ↓
guardHorseCreation() in subscriptionGuard.ts:
  1. Gets user's plan: tier, horseLimit
  2. Counts user's active horses: Horse.countDocuments({ mainOwnerUserId, isActive })
  3. If current < limit → allow
  4. If current >= limit → return { ok: false, requiredTier: "silver" }
  ↓
If blocked → API returns 403 with code "HORSE_LIMIT_REACHED"
  Frontend shows popup: "Upgrade to Silver to add more horses"
```

### 6. Subscription Enforcement (Ownership Transfer)

```
Owner A transfers a horse to User B
  ↓
User B receives notification (in-app + email)
  ↓
User B clicks "Accept"
  ↓
ownershipTransferService calls guardAcceptTransfer(userBId)
  ↓
guardAcceptTransfer() checks User B's plan limit
  If within limit → transfer proceeds
  If at limit → return { ok: false, requiredTier }
  ↓
Frontend shows popup:
  "Accepting this horse would exceed your plan limit.
   Upgrade to Silver to accept."
  [Upgrade & Accept] or [Decline]
```

---

## Stripe Objects Mapping

| Stripe Object | How it's Used | Created By |
|---|---|---|
| **Product** | Identifies the tier (Bronze, Silver, etc.) | Stripe Dashboard (once) |
| **Price** | Defines amount + currency + interval | Dynamically on each checkout |
| **Checkout Session** | Payment page for initial subscription | `createCheckoutSession()` |
| **Subscription** | Recurring billing | Stripe (after checkout) |
| **Customer Portal** | User manages plan/payment/cancel | `createPortalSession()` |
| **Invoice** | Monthly billing receipt | Stripe (auto) |
| **Customer** | User's payment profile | Stripe (auto, from checkout) |

---

## Environment Variables

```
# Stripe API Keys (from Stripe Dashboard)
STRIPE_SECRET_KEY=sk_live_...          # Server-side Stripe SDK
STRIPE_WEBHOOK_SECRET=whsec_...        # Verify webhook signatures

# Stripe Product IDs (from Stripe Dashboard → Products)
STRIPE_PRODUCT_BRONZE=prod_xxx         # Bronze tier
STRIPE_PRODUCT_SILVER=prod_xxx         # Silver tier
STRIPE_PRODUCT_GOLD=prod_xxx           # Gold tier
STRIPE_PRODUCT_DIAMOND=prod_xxx        # Diamond tier
```

The Product IDs are the only Stripe-specific IDs stored in env vars. All price values come from `lib/billing/plans.ts`.

---

## Stripe Dashboard Setup

### Step 1: Create Products

1. Go to Stripe Dashboard → Products → Add Product
2. Create one product per paid tier:
   - Name: "Bronze", "Silver", "Gold", "Diamond"
   - Description: match the tier description from `plans.ts`
   - Do NOT add pricing — prices are created dynamically
3. Copy each Product ID (`prod_xxx`) to `.env`

### Step 2: Configure Webhook

1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://api.equus.app/api/v1/billing/webhook`
3. Events to listen:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook signing secret (`whsec_...`) to `.env`

### Step 3: Testing Locally

```bash
# Install Stripe CLI, then:
stripe login
stripe listen --forward-to localhost:3000/api/v1/billing/webhook

# In another terminal, test the webhook:
stripe trigger checkout.session.completed
```

---

## Discount System

Discounts are stored on `User.subscription`:

```typescript
"subscription.discountPercentage": 20,     // 20% off
"subscription.discountValidUntil": ISODate("2027-01-10"),  // expires
```

When creating a checkout session, the discount is applied as a Stripe Coupon:

```typescript
// If user has an active discount, create and attach a coupon
if (user.subscription.discountPercentage > 0) {
  const coupon = await stripe.coupons.create({
    percent_off: user.subscription.discountPercentage,
    duration: user.subscription.discountValidUntil ? "once" : "forever",
  });
  session = await stripe.checkout.sessions.create({
    ...,
    discounts: [{ coupon: coupon.id }],
  });
}
```

Admin sets discounts directly in the database (future admin UI):

```javascript
// mongosh command
db.users.updateOne(
  { _id: ObjectId("...") },
  { $set: {
    "subscription.discountPercentage": 20,
    "subscription.discountValidUntil": ISODate("2027-01-10"),
  }}
);
```

---

## Payment Gating

When a subscription goes `past_due` (payment failed):

1. **Day 0-13:** User can still access all horse data (grace period)
2. **Day 14+:** `applyPaymentGate()` sets `registration.dataAvailability = "payment_blocked"` on all active horses
3. On next successful payment: `restorePaymentAccess()` sets all horses back to `dataAvailability = "available"`
4. Horse creation is also blocked while status is `past_due`

The gating is enforced by `lib/billing/paymentGate.ts` and triggered by webhook events.

---

## Webhook Reference

| Stripe Event | What We Do | User Fields Updated |
|---|---|---|
| `checkout.session.completed` | Activate subscription for the chosen tier | tier, status, stripeCustomerId, stripeSubscriptionId, currentPeriod |
| `customer.subscription.updated` | Sync status changes | status, currentPeriodStart, currentPeriodEnd |
| `customer.subscription.deleted` | Downgrade to Free | tier=free, status=canceled, canceledAt |
| `invoice.payment_succeeded` | Confirm active + restore data | status=active, restorePaymentAccess() |
| `invoice.payment_failed` | Mark as past_due | status=past_due |

---

## Proration

Proration (mid-cycle plan changes) is handled **entirely by Stripe**:

- **Upgrade mid-cycle:** Stripe calculates the prorated amount for remaining days on the old plan, charges the difference
- **Downgrade mid-cycle:** Stripe calculates a credit for unused days on the old plan, applies to the next invoice
- Our system only syncs the result via webhooks (tier change, period dates)

The detailed receipt showing proration calculation is available in Stripe Customer Portal.
