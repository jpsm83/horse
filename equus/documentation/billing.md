# Equus Subscription Billing — Implementation Guide

**Last updated:** 2026-07-10

---

## Architecture Overview

The billing system is organized in four layers:

```
┌─────────────────────────────────────────────┐
│               Config Layer                    │
│        lib/billing/plans.ts                   │
│   (tier definitions, prices per currency)     │
└────────────────────┬─────────────────────────┘
                     │
┌────────────────────▼─────────────────────────┐
│              Service Layer                     │
│  ┌──────────────────┐  ┌───────────────────┐ │
│  │ horseCounter.ts  │  │ subscriptionGuard  │ │
│  │ (count owned     │  │ .ts               │ │
│  │  horses, limits) │  │ (creation,        │ │
│  └──────────────────┘  │  downgrade,        │ │
│  ┌──────────────────┐  │  transfer guards)  │ │
│  │ stripe.ts         │  └───────────────────┘ │
│  │ (SDK, sessions,  │                        │
│  │  portal)          │                        │
│  └──────────────────┘                        │
└────────────────────┬─────────────────────────┘
                     │
┌────────────────────▼─────────────────────────┐
│             Enforcement Layer                  │
│  ┌────────────────────────────────────────┐   │
│  │ horseService.createHorse() → guard     │   │
│  │ ownershipTransferService → guard       │   │
│  │ Billing API routes (create-checkout,   │   │
│  │   portal, webhook, current)            │   │
│  └────────────────────────────────────────┘   │
└────────────────────┬─────────────────────────┘
                     │
┌────────────────────▼─────────────────────────┐
│                UI Layer                        │
│  ┌────────────────────────────────────────┐   │
│  │ Subscription page (plan list, usage)   │   │
│  │ Upgrade modal (when limit reached)     │   │
│  └────────────────────────────────────────┘   │
└───────────────────────────────────────────────┘
```

- **Config Layer** — static plan definitions with prices per currency
- **Service Layer** — horse counting, subscription guards, Stripe helpers
- **Enforcement Layer** — route handlers and service methods that call guards before mutations
- **UI Layer** — React components that display plan info and guide users to Stripe

---

## Tier Config Reference

All plan data is defined in `lib/billing/plans.ts`. To add, edit, or remove a plan, modify the `SUBSCRIPTION_PLANS` record.

### Plan structure

```typescript
type TierId = "free" | "bronze" | "silver" | "gold" | "diamond";
type CurrencyCode = "USD" | "EUR" | "GBP" | "BRL" | "CAD" | "AUD" | "CHF" | "JPY";

interface SubscriptionPlan {
  id: TierId;
  name: string;
  horseLimit: number;       // Max owned horses (includes the 1 free horse)
  prices: Record<CurrencyCode, number>;  // Monthly price in cents
  description: string;
}
```

### Current plans

| Tier | Horse Limit | USD | EUR | GBP | BRL | CAD | AUD | CHF | JPY |
|------|------------|-----|-----|-----|-----|-----|-----|-----|-----|
| Free | 1 | $0 | €0 | £0 | R$0 | $0 | $0 | CHF 0 | ¥0 |
| Bronze | 3 | $89 | €79 | £69 | R$349 | $119 | $129 | CHF 79 | ¥9,800 |
| Silver | 5 | $149 | €139 | £119 | R$549 | $199 | $219 | CHF 139 | ¥15,000 |
| Gold | 8 | $219 | €199 | £179 | R$799 | $299 | $319 | CHF 199 | ¥22,000 |
| Diamond | ∞ | $329 | €299 | £269 | R$1,199 | $439 | $479 | CHF 299 | ¥35,000 |

All prices are **monthly** and stored in **cents** (minor currency unit) to avoid floating-point issues.

### Adding a new tier

1. Add a new `TierId` literal to the union type
2. Add a new entry in `SUBSCRIPTION_PLANS` with all currencies
3. Create Stripe Product + Prices per currency (see Stripe setup below)
4. Add the Stripe Price IDs to `lib/billing/stripe.ts` or env vars
5. Add the tier to `tierEnums` in `models/User.ts` and `utils/enums.ts`

### Adding a new currency

1. Add the currency code to `CurrencyCode` type
2. Add prices for every existing plan
3. Create Stripe Prices for each plan in the new currency
4. Store the new Stripe Price IDs

### Helpers

```typescript
getPlan(tierId: TierId): SubscriptionPlan
getPlanByStripePriceId(priceId: string): SubscriptionPlan | null
getEffectivePrice(tierId: TierId, currency: CurrencyCode, discountPercent: number): number
canOwnMoreHorses(currentCount: number, tierId: TierId): boolean
getRequiredTierForHorseCount(count: number): TierId
```

---

## Stripe Setup Guide

### Products and Prices

Create one Stripe **Product** per tier (Bronze, Silver, Gold, Diamond). The Free tier has no Stripe product.

For each product, create one Stripe **Price** per supported currency (8 prices per tier = 32 total prices). All prices are **recurring monthly**.

**Stripe Dashboard steps:**

1. Products → Add Product (name: "Bronze", "Silver", etc.)
2. Add pricing model: "Standard pricing" → "Recurring" → "Monthly"
3. Create one price per currency (use the cents values from the table above)
4. Copy the Price IDs (`price_xxx`) into the configuration

### Environment variables

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

In development, use `sk_test_` / `pk_test_` keys and the Stripe CLI for webhook forwarding.

### Webhook endpoint

`POST /api/v1/billing/webhook` — receives Stripe events (signed payload, no auth).

Configure the endpoint in Stripe Dashboard → Developers → Webhooks → Add endpoint:
- URL: `https://api.equus.app/api/v1/billing/webhook`
- Events to send: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`

### Webhook event reference

| Stripe Event | Action on User model |
|---|---|
| `checkout.session.completed` | Set `subscription.tier` to plan tier, `subscription.status = "active"`, store `stripeCustomerId` and `stripeSubscriptionId` |
| `customer.subscription.updated` | Sync `subscription.status` (active/past_due/canceled), update `currentPeriodStart` and `currentPeriodEnd`, update `tier` if plan changed |
| `customer.subscription.deleted` | Set `subscription.tier = "free"`, `subscription.status = "canceled"`, set `canceledAt` |
| `invoice.payment_succeeded` | Confirm `subscription.status = "active"`, update `currentPeriodEnd` |
| `invoice.payment_failed` | Set `subscription.status = "past_due"` |

### Testing webhooks locally

```bash
stripe listen --forward-to localhost:3000/api/v1/billing/webhook
stripe trigger checkout.session.completed
```

### API routes

| Endpoint | Purpose |
|---|---|
| `POST /api/v1/billing/create-checkout` | Create Stripe Checkout Session; body: `{ tierId, currency }`; returns `{ url }` |
| `POST /api/v1/billing/portal` | Create Stripe Customer Portal session; returns `{ url }` |
| `POST /api/v1/billing/webhook` | Stripe event receiver (signed) |
| `GET /api/v1/billing/current` | Returns `{ tier, status, currentHorses, horseLimit, currency, discount, periodEnd }` |

---

## Discount System

Discounts are stored on `User.subscription` as a percentage:

```typescript
{
  discountPercentage: number,    // 0–100 (e.g., 20 = 20% off)
  discountValidUntil: Date|null  // null = permanent
}
```

When creating or changing a Stripe subscription, the backend applies a Stripe Coupon matching the user's discount. The webhook syncs the effective price back to the database.

**Flow:**
1. Admin sets `discountPercentage` on user (via DB directly — see Admin Operations)
2. User creates/changes subscription
3. Backend calls `stripe.coupons.create({ percent_off, duration: "forever" })`
4. Coupon is attached to the Checkout Session or Subscription
5. Stripe applies the discount; webhook syncs status

---

## Admin Operations Reference

All operations are direct MongoDB commands (run in `mongosh` or Compass). A future admin page will provide a UI.

### Set discount

```javascript
db.users.updateOne(
  { _id: ObjectId("user_id_here") },
  { $set: {
    "subscription.discountPercentage": 20,
    "subscription.discountValidUntil": ISODate("2027-01-10")
  }}
)
```

### Remove discount

```javascript
db.users.updateOne(
  { _id: ObjectId("user_id_here") },
  { $set: {
    "subscription.discountPercentage": 0
  },
  $unset: {
    "subscription.discountValidUntil": ""
  }}
)
```

### Manual tier change

```javascript
db.users.updateOne(
  { _id: ObjectId("user_id_here") },
  { $set: {
    "subscription.tier": "silver",
    "subscription.status": "active"
  }}
)
```

Use manual tier changes **sparingly** — they bypass Stripe billing. Prefer having the user go through the normal upgrade flow. Only use this for:
- Correcting data after a webhook sync issue
- Granting complimentary access (e.g., beta testers, partners)

### Force cancel

```javascript
db.users.updateOne(
  { _id: ObjectId("user_id_here") },
  { $set: {
    "subscription.tier": "free",
    "subscription.status": "canceled",
    "subscription.canceledAt": new Date()
  }}
)
```

### Lookup user by Stripe customer ID

```javascript
db.users.findOne({ "subscription.stripeCustomerId": "cus_xxx" })
```

### View all users on a specific tier

```javascript
db.users.find(
  { "subscription.tier": "bronze", "subscription.status": "active" },
  { email: 1, "subscription": 1 }
).sort({ "subscription.currentPeriodEnd": -1 })
```

---

## Payment Gating Overview

When a user's subscription enters `past_due` status (payment failed), the system restricts access after a configurable grace period.

### State machine

```
trial → active ←→ past_due → canceled
         ↑                        |
         └────────────────────────┘
```

- **trial** — default on signup; user hasn't paid yet
- **active** — payment is current; full access
- **past_due** — payment failed; grace period started
- **canceled** — subscription ended; user downgraded to Free

### Data access blocking

On `past_due` after grace period (7 days):
- Horse `registration.dataAvailability` set to `"payment_blocked"`
- User sees horse names and basic info only
- Detailed data (medical records, training logs, documents, invoices) returns empty/blocked
- Horse creation is blocked
- All horses return to `"available"` when `invoice.payment_succeeded` webhook fires

### Implementation

The gating can be implemented as:
1. **Cron job** — periodic scan updates `dataAvailability` for expired grace periods
2. **On-access check** — middleware or service checks `subscription.status` and grace period before returning sensitive data

Option 2 is preferred for real-time accuracy and avoids sync delays.

---

## FAQ / Troubleshooting

**Q: What happens when a user's horse count exceeds their tier limit?**
A: The system prevents new horse creation and ownership transfer acceptance until the user upgrades. Existing horses are not affected — the user simply cannot add more.

**Q: Can a user have multiple subscriptions?**
A: No. One subscription per user account across all roles.

**Q: How does co-ownership affect billing?**
A: Co-owners (`coOwners[]` on Horse) do not count toward the horse limit. Only `mainOwnerUserId` horses count. This prevents double-billing and keeps the model simple.

**Q: What if Stripe webhooks fail or arrive out of order?**
A: The webhook handler is idempotent based on the Stripe event ID. If a `subscription.updated` arrives before `checkout.session.completed`, it's handled gracefully. A retry/reconciliation job can sync any missed events on a schedule.

**Q: How do refunds work?**
A: Refunds are handled in the Stripe Dashboard. The webhook syncs the updated subscription state. This policy may be refined — for now, Stripe handles all payment disputes and refunds.

**Q: How do we handle international users without Stripe support?**
A: Stripe is available in all target markets (US, EU, UK, Brazil, Canada, Australia, Switzerland, Japan). If a user's country is unsupported, the system falls back to their default currency or blocks checkout with a clear message.
