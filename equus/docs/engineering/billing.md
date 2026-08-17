# Billing (entity subscription)

**Job:** Stripe + good-standing enforcement for **paid entities**. Prices stay in product.  
**Upstream:** [`../features/entitySubscription.md`](../features/entitySubscription.md), [`../product/monetization.md`](../product/monetization.md)  
**Status:** **drift**  
**Code roots (dead owner-tier — do not extend):** `lib/billing/{plans,horseCounter,subscriptionGuard,stripe,paymentGate}.ts`, `app/api/v1/billing/`, `models/User.subscription`, `Horse.subscription.payerUserId`, `components/user/subscription/`, `lib/horses/horseSubscriptionBilling.ts`

---

## Shipped — do not extend

Owner-pays **horse-count tiers** on `User.subscription` (`free` / `bronze` / …). `horseCounter.ts` counts owned horses; `subscriptionGuard` blocks `horseService.createHorse` and ownership accept. Stripe checkout/portal/webhook/current assume **user** as customer. UI: `/user/[userId]/subscription`.

**Do not** add tiers, currencies, or new guards on this model. **Do not** reintroduce owner horse-count paywalls or `$99`/horse.

| File | Today |
|------|--------|
| `lib/billing/plans.ts` | Horse-limit tiers + prices |
| `lib/billing/horseCounter.ts` | Count horses the user owns |
| `lib/billing/subscriptionGuard.ts` | Create-horse / transfer accept caps |
| `lib/billing/stripe.ts` | Checkout from `plans.ts` + `STRIPE_PRODUCT_*` |
| `app/api/v1/billing/*` | `create-checkout`, `portal`, `current`, `webhook` |

---

## Target

Who-pays, meter, lapse, catalog: [`../features/entitySubscription.md`](../features/entitySubscription.md) + [`../product/monetization.md`](../product/monetization.md). Do not copy prices here.

| Piece | Contract |
|-------|----------|
| Stripe | Customer + subscription **on the entity** (owning User is the Stripe customer). Replace user-tier checkout/portal/webhook. |
| Guards | Gate **stable (entity) writes**, not `createHorse`. |
| Meter code | Count current roster (formula in features). Adding a horse does not auto-change Stripe. |
| Dead fields | Do not wire `Horse.subscription.payerUserId` or `dataAvailability: payment_blocked`. |
