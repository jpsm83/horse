# Equus — Implementation Guides

Engineering documentation for the Equus Next.js application. Product specs live in [`../../documentation/`](../../documentation/README.md).

---

## Architecture & Stack

| Doc | Purpose |
|-----|---------|
| [`stack.md`](./stack.md) | Technical stack, architecture principles, folder structure |
| [`page-flow-blueprint.md`](./page-flow-blueprint.md) | Canonical page pattern: shell, loading, error boundaries, parent-owned Save for Profile/Admin |
| [`component-resilience.md`](./component-resilience.md) | Loading states, skeletons, ErrorBoundary stacking |
| [`errors.md`](./errors.md) | Three-layer error handling (global, page, section) |
| [`i18n.md`](./i18n.md) | Locales, routing, `NEXT_LOCALE` cookie |

## Auth & User

| Doc | Purpose |
|-----|---------|
| [`auth.md`](./auth.md) | Web session (cookies), mobile JWT, Google bridge, token refresh |
| [`profile.md`](./profile.md) | Account profile + preferences routes, `PATCH /me`, preview/Save/discard, deactivation |
| [`userAuthTodo.md`](./userAuthTodo.md) | User/auth readiness checklist (UA-00 through UA-31) |
| [`dataLifecycle.md`](./dataLifecycle.md) | Engineering patterns: tombstone fields, service conventions |
| [`piiAnonymization.md`](./piiAnonymization.md) | GDPR PII anonymization pipeline (UA-31) |

## Entity Role APIs

| Doc | Entities Covered |
|-----|------------------|
| [`horses.md`](./horses.md) | Horse endpoints, visibility model, media gallery, deletion requests |
| [`stables.md`](./stables.md) | Stable endpoints, discovery visibility |
| [`breeders.md`](./breeders.md) | Breeder endpoints, discovery visibility |
| [`transports.md`](./transports.md) | Transport endpoints, discovery visibility |
| [`riding-clubs.md`](./riding-clubs.md) | Riding club endpoints, discovery visibility |
| [`trainers.md`](./trainers.md) | Trainer endpoints (user-linked) |
| [`grooms.md`](./grooms.md) | Groom endpoints (user-linked) |
| [`veterinaries.md`](./veterinaries.md) | Veterinary endpoints (user-linked) |
| [`farriers.md`](./farriers.md) | Farrier endpoints (user-linked) |
| [`coaches.md`](./coaches.md) | Coach endpoints (user-linked) |
| [`riders.md`](./riders.md) | Rider endpoints (user-linked) |

## Horse Pages & Tabs

| Doc | Purpose |
|-----|---------|
| [`horseTabs.md`](./horseTabs.md) | Horse tab structure, routes, visibility, tab order |

## Product / competitive specs (canonical in `/documentation`)

| Doc | Purpose |
|-----|---------|
| [`../../documentation/horseModule.md`](../../documentation/horseModule.md) | Horse feature spec — includes §14 first-delivery social backlog (`H-FD-*`) |
| [`../../documentation/userModule.md`](../../documentation/userModule.md) | User feature spec — includes §12 first-delivery social backlog (`U-FD-*`) |
| [`../../documentation/stableModule.md`](../../documentation/stableModule.md) | Stable feature spec — includes §12 first-delivery SaaS backlog (`S-FD-*`) |
| [`../../documentation/firstDeliveryCompetitiveBacklog.md`](../../documentation/firstDeliveryCompetitiveBacklog.md) | First delivery extract from market research |
| [`../../documentation/appCompetition/webapps.md`](../../documentation/appCompetition/webapps.md) | Full competitive benchmark (12 products, including EquineM) |

## Relationships & Ownership

| Doc | Purpose |
|-----|---------|
| [`relationships.md`](./relationships.md) | Horse-to-provider relationships, invitation flow |
| [`ownershipTransfer.md`](./ownershipTransfer.md) | Consent-based ownership transfer REST API |

## Billing

| Doc | Purpose |
|-----|---------|
| [`billing.md`](./billing.md) | Subscription plans, Stripe setup, webhooks, discounts, payment gating, key flows |
