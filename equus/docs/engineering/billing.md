# Billing (entity subscription)

**Job:** Stripe + good-standing enforcement for **paid entities**. Prices stay in product.  
**Upstream:** [`../features/entitySubscription.md`](../features/entitySubscription.md), [`../product/monetization.md`](../product/monetization.md)  
**Status:** **aligned** (Stable at launch)  
**Code roots:** `lib/billing/`, `app/api/v1/billing/`, `models/Stable.subscription`, `components/stable/admin/stable-billing-section.tsx`

---

## Shipped

- **Customer:** Stripe customer = owning **User**; subscription metadata + status stored on **Stable** (`subscription` subdocument).
- **Trial:** New stables get **30-day trialing** good standing (`buildDefaultEntitySubscription` on `createStable`).
- **Catalog:** Roster bands (`starter` … `scale`) in `entityCatalog.ts`; persisted `monthlyPriceCents` on entity wins at checkout.
- **Meter:** `rosterMeter.countStableRoster` — active accepted horse↔stable `Relationship` rows (not an enforced cap).
- **Guards:** `assertStableWriteAllowed` on stable profile/discovery PATCH when not in good standing.
- **API:** `GET /api/v1/billing/current?stableId=` · `POST /api/v1/billing/create-checkout` · `POST /api/v1/billing/portal` · webhook updates Stable subscription.
- **UI:** Stable Admin → Subscription section (`StableBillingSection`). Global `/subscription` redirects to `/home`.
- **Horses:** Free, unlimited — no user-tier caps on `createHorse` or `transfer_main` accept.

**Do not wire:** `Horse.registration.payerUserId` on create/transfer · `User.subscription` tiers for horse counts · `dataAvailability: payment_blocked`.

| File | Role |
|------|------|
| `lib/billing/entityCatalog.ts` | Band shape + suggest price |
| `lib/billing/entitySubscription.ts` | Good standing + billing DTO |
| `lib/billing/rosterMeter.ts` | Current roster count |
| `lib/billing/entityWriteGuard.ts` | Stable write gate |
| `lib/billing/stripe.ts` | Checkout, portal, webhook |

---

## Target / later

- Waiting-transfer horses in roster count (greenfield flag).
- Write-lock on stable **ops** routes when they ship (roster, whiteboard, …).
- Paid entity types beyond Stable copy the same pattern per [`later-modules.md`](later-modules.md).

Owner-tier **dead code removed:** `plans.ts`, `horseCounter.ts`, `subscriptionGuard.ts`, `paymentGate.ts`, `horseSubscriptionBilling.ts`, user Subscription tab UI.
