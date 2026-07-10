# Equus Subscription Billing System — Design

**Date:** 2026-07-10
**Project:** Equus (Next.js 16, App Router, Mongoose, Stripe)

---

## Goal

Replace the current per-horse billing model (hardcoded $99/horse/month on Horse.subscription embed) with a **user-tier subscription model**: users subscribe to a plan (Free/Bronze/Silver/Gold/Diamond) that caps how many horses they can own. Implement Stripe integration for recurring billing, multi-currency pricing, discount system, and subscription enforcement guards.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Config Layer                         │
│              lib/billing/plans.ts                        │
│   (tier definitions, prices per currency, helpers)       │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                     Service Layer                        │
│  ┌──────────────────┐  ┌───────────────────────────┐    │
│  │ horseCounter.ts  │  │ subscriptionGuard.ts      │    │
│  │ (count owned     │  │ (canCreate, canDowngrade, │    │
│  │  horses, check   │  │  canAcceptTransfer)       │    │
│  │  limits)         │  └───────────────────────────┘    │
│  └──────────────────┘                                    │
│  ┌──────────────────┐  ┌───────────────────────────┐    │
│  │ stripe.ts        │  │ stripe-webhook.ts         │    │
│  │ (SDK, sessions,  │  │ (sync status, tier,      │    │
│  │  portal)         │  │  subscription events)     │    │
│  └──────────────────┘  └───────────────────────────┘    │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                   Enforcement Layer                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │ horseService.createHorse()                        │   │
│  │   → guard: canUserAddHorse()                      │   │
│  │   → if at limit → return upgrade suggestion       │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ ownershipTransferService.applyTransfer()          │   │
│  │   → guard: canUserAcceptHorse()                   │   │
│  │   → if no room → return upgrade suggestion        │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Billing API routes                                │   │
│  │ /create-checkout, /portal, /webhook, /current     │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                     UI Layer                             │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Subscription page (custom)                        │   │
│  │ → plan list with prices, current usage bar        │   │
│  │ → "Change Plan" → Stripe Customer Portal          │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Popup/Modal (horse limit reached)                 │   │
│  │ → "Upgrade to Diamond to add more horses"         │   │
│  │ → [Upgrade & Create] [Cancel]                     │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 1. Subscription Plans Config (`lib/billing/plans.ts`)

```typescript
export type TierId = "free" | "bronze" | "silver" | "gold" | "diamond";
export type CurrencyCode = "USD" | "EUR" | "GBP" | "BRL" | "CAD" | "AUD" | "CHF" | "JPY";

export interface SubscriptionPlan {
  id: TierId;
  name: string;
  horseLimit: number;       // Max horses INCLUDING the 1 free horse
  prices: Record<CurrencyCode, number>;  // Monthly price in cents
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

export function getPlan(tierId: TierId): SubscriptionPlan;
export function getPlanByStripePriceId(priceId: string): SubscriptionPlan | null;
export function getEffectivePrice(tierId: TierId, currency: CurrencyCode, discountPercent: number): number;
export function canOwnMoreHorses(currentCount: number, tierId: TierId): boolean;
export function getRequiredTierForHorseCount(count: number): TierId;
export function tiereEnums: TierId[];
export const tierEnums = ["free", "bronze", "silver", "gold", "diamond"] as const;
```

---

## 2. User Model Changes

Add `subscription` embed to `models/User.ts`:

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
  currency: { type: String, enum: ["USD", "EUR", "GBP", "BRL", "CAD", "AUD", "CHF", "JPY"], default: "USD" },
  discountPercentage: { type: Number, default: 0, min: 0, max: 100 },
  discountValidUntil: { type: Date },
  canceledAt: { type: Date },
}
```

---

## 3. Horse Model Changes

Simplify the existing `horseSubscriptionSchema` — remove per-horse pricing fields, keep commission/referral tracking. Add lifecycle and payment-gating fields:

```typescript
// Before (current):
horseSubscriptionSchema = {
  status, monthlyFee, currency, trialStartedAt, trialEndsAt,
  subscriptionStartedAt, canceledAt, payerUserId,
  attributedAccountType, attributedAccountId, referralReference, commissionEligibleUntil,
};

// After (simplified):
horseRegistrationSchema = {
  addedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  dateOfDeath: { type: Date, default: null },          // If set, horse is deceased → inactive
  dataAvailability: {
    type: String,
    enum: ["available", "payment_blocked"],
    default: "available",
  },  // Payment gating: blocked if subscription is past_due
  payerUserId: { type: Schema.Types.ObjectId, ref: "User" },
  // Commission tracking (kept from current)
  attributedAccountType: { type: String, enum: accountTypeEnums },
  attributedAccountId: { type: Schema.Types.ObjectId },
  referralReference: { type: String },
  commissionEligibleUntil: { type: Date },
};
```

### Key rules:
- **`isActive`**: Only active horses count toward the user's subscription limit. Horses with `dateOfDeath` set automatically become inactive.
- **`dateOfDeath`**: When a horse dies, set this date. The horse becomes inactive, preserving all historical data. Still visible in the owner's horse history, but not counted for billing.
- **`dataAvailability`**: If the user's subscription is `past_due` (payment failed), the horse's data becomes `payment_blocked` after a grace period. The user can still see the horse exists but cannot access detailed data (medical records, documents, training logs, etc.). When payment is restored (webhook receives `invoice.payment_succeeded`), data returns to `available`.

The horse's billing responsibility moves from per-horse subscription to the user's tier plan. The `payerUserId` is kept for referral commission attribution.

---

## 4. Horse Counter (`lib/billing/horseCounter.ts`)

```typescript
export async function countUserOwnedHorses(userId: string): Promise<number>;

export async function getUserHorseUsage(
  userId: string
): Promise<{ current: number; limit: number; tierId: TierId; remaining: number }>;

export async function canUserAddHorse(
  userId: string
): Promise<{ allowed: boolean; current: number; limit: number; requiredTier: TierId | null }>;
```

Counting rule: only horses where `mainOwnerUserId == userId` AND `registration.isActive == true`. Co-ownership (`coOwners[].userId`) does NOT count toward the user's limit. Horses with `dateOfDeath` set are automatically inactive and excluded from the count.

---

## 5. Subscription Guard (`lib/billing/subscriptionGuard.ts`)

```typescript
// Before creating a horse — returns upgrade suggestion if at limit
export async function guardHorseCreation(
  userId: string
): Promise<{ ok: true } | { ok: false; current: number; limit: number; requiredTier: TierId }>;

// Before changing plan — returns error if horse count exceeds new tier
export async function guardPlanDowngrade(
  userId: string,
  newTier: TierId
): Promise<{ ok: true } | { ok: false; reason: string; horsesToResolve: number }>;

// Before accepting ownership transfer
export async function guardAcceptTransfer(
  userId: string
): Promise<{ ok: true } | { ok: false; current: number; limit: number; requiredTier: TierId }>;
```

---

## 6. Stripe Integration (`lib/billing/stripe.ts`, `lib/billing/stripe-webhook.ts`)

### Stripe Products & Prices

One Stripe Product per tier (Bronze, Silver, Gold, Diamond). One Stripe Price per currency per tier (e.g., Bronze-USD, Bronze-EUR, etc.). Price IDs stored in the plan config or env vars.

### Webhook Events

| Stripe Event | Action |
|---|---|
| `checkout.session.completed` | Set `user.subscription.tier = plan`, status = "active", store Stripe IDs |
| `customer.subscription.updated` | Sync status: past_due, active, canceled. Update period dates. |
| `customer.subscription.deleted` | Downgrade user to Free, set `canceledAt` |
| `invoice.payment_succeeded` | Confirm status active, update `currentPeriodEnd` |
| `invoice.payment_failed` | Set status = "past_due" |

### API Routes

```
POST /api/v1/billing/create-checkout
  Body: { tierId: "silver", currency: "USD" }
  Response: { url: "https://checkout.stripe.com/..." }

POST /api/v1/billing/portal
  Response: { url: "https://billing.stripe.com/..." }

POST /api/v1/billing/webhook
  (Stripe webhook receiver — no auth, signed payload)

GET /api/v1/billing/current
  Response: { tier, status, currentHorses, horseLimit, currency, discount, periodEnd }
```

---

## 7. Enforcement Flows

### Default Subscription
Every user account is created with `subscription.tier = "free"` and `subscription.status = "trial"`. The user can change their plan at any time via the subscription page. They will be prompted to upgrade if they try to add more horses than their current plan allows.

### Horse Creation (at limit)
```
User navigates to "Add Horse" page
  → Server returns horse limit info: { current: 5, limit: 5, atLimit: true }
  → A banner appears at the top of the page (like the incomplete-profile banner):
    "You've reached your {tier} limit of {limit} horses. 
     Upgrade to add more horses."

User fills the horse creation form (ignoring the banner if they want)
  → User clicks "Save" (submit button)
  → Server calls guardHorseCreation()
  → If at limit:
    → Return 403 with: { code: "HORSE_LIMIT_REACHED", current, limit, requiredTier }
    → Frontend shows modal/popup:
      "You've reached your {tier} limit of {limit} horses.
       Upgrade to {requiredTier} ({price}/month) to add more horses."
      [Upgrade & Create] → calls create-checkout → Stripe → webhook updates tier → retry
      [Cancel]
```

### Plan Downgrade
```
User selects new tier in Customer Portal
  → Stripe calls us before changing (via subscription.update webhook)
  → We check guardPlanDowngrade():
    → If ok: Stripe proceeds with proration
    → If not ok: We'd need to prevent this in our UI before redirecting to Portal
```

**Note:** Since Stripe Customer Portal handles plan changes directly, we show a pre-check in our UI before redirecting. Our subscription page validates the downgrade and shows the popup before the user leaves for Stripe.

### Ownership Transfer (receiving end)
```
Owner A initiates transfer of Horse X to User B
  → Horse X still belongs to Owner A until User B accepts
  → User B receives notification (in-app + email): 
    "Owner A has transferred Horse X to you. Accept to take ownership."

User B clicks "Accept"
  → Server calls guardAcceptTransfer(recipientUserId)
  → If allowed: process transfer, horse now belongs to User B
  → If no room (User B's subscription is at limit):
    → Return { code: "HORSE_LIMIT_REACHED", current, limit, requiredTier }
    → Frontend modal:
      "Accepting this horse would exceed your {tier} limit of {limit} horses.
       Upgrade to {requiredTier} ({price}/month) to accept this horse."
      [Upgrade & Accept] → calls create-checkout → Stripe → webhook → retry accept
      [Decline] → transfer is declined, horse stays with Owner A
```

### Payment Gating (data access block)
```
User's subscription becomes past_due (payment failed)
  → Stripe webhook sets user.subscription.status = "past_due"
  → Grace period starts (configurable, e.g. 7 days)
  → After grace period:
    → All horses owned by this user get registration.dataAvailability = "payment_blocked"
    → User can still see horse names and basic info
    → Blocked data: medical records, documents, training logs, invoices
    → Horse creation is also blocked until payment is restored
  → On next successful payment (webhook: invoice.payment_succeeded):
    → All horses return to dataAvailability = "available"
    → Full access restored

Implementation: a scheduled job (cron) or on-access check:
  If user.subscription.status == "past_due" AND currentDate > (lastPaymentAttempt + gracePeriod):
    → Block data access
```

---

## 8. Discount System

Two fields on `User.subscription`:
- `discountPercentage` (0-100) — e.g., 20 = 20% off
- `discountValidUntil` (Date | null) — null = permanent, Date = expires

When creating/changing a Stripe subscription, apply the discount as a Stripe Coupon:
```typescript
stripe.coupons.create({ percent_off: discountPercentage, duration: "forever" });
// Then attach coupon to subscription
```

The webhook syncs the effective price back to our database.

Admin operations (DB direct for now, documented for future admin UI):
```
db.users.updateOne({ _id: userId }, {
  $set: {
    "subscription.discountPercentage": 20,
    "subscription.discountValidUntil": ISODate("2027-01-10"),
  }
})
```

---

## 9. Subscription Page (UI)

A new page at `app/[locale]/subscription/page.tsx`:

**Sections:**
1. **Current Plan** — shows active tier, usage bar (X of Y horses), status (active/past_due)
2. **Available Plans** — card grid comparing all tiers (price, horse count, features)
3. **Change Plan** — button per tier → redirects to Stripe Customer Portal
4. **Update Payment** — button → redirects to Stripe Customer Portal
5. **Billing History** — link to Stripe Customer Portal invoices
6. **Cancel Subscription** — confirmation flow → redirects to Stripe Customer Portal

The page is informational + redirection. All sensitive operations (payment, cancellation, invoice viewing) happen in Stripe Customer Portal.

---

## 10. Proration (Mid-Cycle Plan Changes)

Handled entirely by Stripe:
- When user upgrades: Stripe calculates prorated amount for remaining days on old plan, charges the difference, applies new price going forward
- When user downgrades: Stripe calculates credit for unused days on old plan, applies to next invoice
- Our webhook syncs the new plan and period dates
- The receipt/invoice is available in Stripe Customer Portal

---

## 11. Documents to Update/Create

| File | Action |
|------|--------|
| `documentation/businessPlan.md` Section 11 | Update with new tier model, prices, multi-currency |
| `documentation/billing.md` | NEW — Full implementation guide (architecture, Stripe setup, tier config, discount system, admin reference) |

---

## 12. Files to Create

| File | Purpose |
|------|---------|
| `lib/billing/plans.ts` | Tier definitions and helpers |
| `lib/billing/horseCounter.ts` | Horse counting by owner |
| `lib/billing/subscriptionGuard.ts` | Enforcement guards |
| `lib/billing/stripe.ts` | Stripe SDK config, session/portal creation |
| `app/api/v1/billing/create-checkout/route.ts` | Checkout session endpoint |
| `app/api/v1/billing/portal/route.ts` | Customer portal endpoint |
| `app/api/v1/billing/webhook/route.ts` | Stripe webhook receiver |
| `app/api/v1/billing/current/route.ts` | Current plan endpoint |
| `app/[locale]/subscription/page.tsx` | Subscription management page |
| `components/billing/subscription-page-content.tsx` | Client component for sub page |
| `documentation/billing.md` | Implementation + admin reference |

## 13. Files to Modify

| File | Changes |
|------|---------|
| `models/User.ts` | Add `subscription` embed |
| `models/Horse.ts` | Simplify subscription → registration embed (add isActive, dateOfDeath, dataAvailability) |
| `lib/services/horseService.ts` | Add subscription guard before horse creation |
| `lib/ownership-transfer/` | Add guard before accepting transfer |
| `documentation/businessPlan.md` | Update monetization section |
| `utils/enums.ts` | Add `tierEnums` if needed |
