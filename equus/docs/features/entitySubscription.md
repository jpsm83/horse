# Entity subscription — product rules

**Source of truth for prices, catalog bands, currencies, and promo types:** [`equus/docs/product/monetization.md`](../product/monetization.md). This file is only **who pays**, **states**, and **what the UI may do**. Do not copy euro amounts here.

Related: [`stableModule.md`](stableModule.md) (roster feeds the meter; ops writes need good standing), [`horseModule.md`](horseModule.md) (owner display), [`dataLifecycle.md`](dataLifecycle.md) (write-lock is not delete).

---

## Customer

- **Payer:** the **User** who owns the **paid entity** (`Stable.mainOwnerUserId` at launch; later each vet/trainer/… profile has its own subscription).
- **Not a payer:** horse owners, as owners. Equus never invoices them for Hub, chat, favorites, or horse profiles.
- One User may operate a stable **and** own horses: they pay **for the stable**, not for owning horses.

## Good standing

The entity is in **good standing** when its subscription is in the default free period, **paid**, or covered by an **active promo**. Then operators **may write** ops (planning, invoices, feed, roster changes).

**Not** in good standing (past 7-day reminder window, no payment): **write-lock** on that entity’s SaaS. Public entity page and **chat stay**. See product lapse rules.

## Owner display (not a paywall on history)

Horse owners **always see saved** Planning events and Documents invoices that already exist — including after the stable stops paying or stops using Equus. **No product delete** of that history.

Write-lock only means the **stable cannot create new** ops until good standing returns. Future events **already created** still show on the horse.

## Meter (stable)

Count **current** roster: active horse↔stable `Relationship` + **waiting-transfer** horses still hosted. Past/`ended` horses do not count. Band **numbers** live in monetization.md. Price is stored **on the entity** (catalog default, overridable). Adding a horse does not auto-change Stripe by itself.

## Feature IDs

| ID | Feature | Status |
|----|---------|--------|
| ES-01 | Entity subscription customer = owning User | planned |
| ES-02 | Good standing → ops writes allowed | planned |
| ES-03 | Write-lock → no new ops; history remains | planned |
| ES-04 | Owner horse display keeps historical entity data | planned |
| ES-05 | Roster size reported for catalog suggestion (not an enforced cap in-app) | planned |
| ES-06 | 30-day default free on new paid entity; extra promos attachable anytime | planned |

Stripe/webhooks: [`equus/docs/engineering/billing.md`](../engineering/billing.md) (`drift` — Shipped is owner-tier **do-not-extend**; Target is this file’s rules).
