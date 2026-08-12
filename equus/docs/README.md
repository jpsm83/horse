# Equus Documentation

Canonical docs for Equus. Everything lives under `equus/docs/`.

**For agents:** [`../AGENTS.md`](../AGENTS.md) is the always-on contract (identity, commands, business rules). Open guides from this index **only when the task needs them** — do not load this whole file or every linked doc by default. Coding rules: open one file under [`conventions/`](conventions/) that matches the area you are changing.

| Folder | Purpose |
|--------|---------|
| [`product/`](product/) | Business strategy & market — vision, MVP scope, metrics, validation, flows, competitive benchmark |
| [`features/`](features/) | Product feature specs — what & why (horse, user, stable, workplace, ownership, data lifecycle) |
| [`engineering/`](engineering/) | Implementation guides — stack, architecture, entities, auth, billing, UI patterns |
| [`conventions/`](conventions/) | Agent & developer coding rules (open on demand from [`AGENTS.md`](../AGENTS.md)) |
| [`superpowers/`](superpowers/) | Superpowers workflow artifacts — dated design specs and implementation plans |

**Superpowers artifacts:** specs → `superpowers/specs/`; plans → `superpowers/plans/`; dated `YYYY-MM-DD-<topic>[-design].md`.

## Read in this order (product / onboarding)

Human and planning onboarding — not required for every coding task.

| Document | Purpose |
|----------|---------|
| [`product/businessPlan.md`](product/businessPlan.md) | Product vision, domain rules, monetization, phased roadmap, competitive positioning (§20) |
| [`engineering/stack.md`](engineering/stack.md) | **Technical stack** — architecture, auth, API, UI, data |
| [`product/mvpScope.md`](product/mvpScope.md) | Build phases (1A/1B) and **production launch gate** |
| [`features/horseModule.md`](features/horseModule.md) | **Horse feature spec** — living doc; owner hub, discovery, relationships |
| [`features/stableModule.md`](features/stableModule.md) | **Stable feature spec** — living doc; EquineM parity + differentiators |
| [`features/workplaceRelationship.md`](features/workplaceRelationship.md) | **User ↔ role profile** workplace link (no business account) |
| [`product/benchMarket/webapps.md`](product/benchMarket/webapps.md) | Market competitive benchmark (12 products, including EquineM §12) |
| [`product/firstDeliveryCompetitiveBacklog.md`](product/firstDeliveryCompetitiveBacklog.md) | **First delivery** extract: user/horse social + stable SaaS from market research |
| [`product/validationPlaybook.md`](product/validationPlaybook.md) | Pre-build customer interviews and go/no-go |
| [`product/productFlows.md`](product/productFlows.md) | Onboarding and core user journeys |
| [`features/userModule.md`](features/userModule.md) | **User feature spec** — identity, roles, privacy, access paths |
| [`features/dataLifecycle.md`](features/dataLifecycle.md) | **Data integrity** — no hard deletes; tombstone fields and lifecycle rules |
| [`features/ownershipTransfer.md`](features/ownershipTransfer.md) | **Entity ownership transfer** — consent-based `OwnershipTransfer` |
| [`product/metricsSpec.md`](product/metricsSpec.md) | Internal business metrics (Phase 1B) |

## Conventions (coding rules)

Open the guide that matches the change; do not preload all of them.

| Guide | Area |
|-------|------|
| [`conventions/architecture.md`](conventions/architecture.md) | Layered structure, multi-client API design, versioning |
| [`conventions/nextjs-conventions.md`](conventions/nextjs-conventions.md) | App Router, route handlers, server/client, chrome, env vars |
| [`conventions/ui-layout-naming.md`](conventions/ui-layout-naming.md) | Horse & user UI layout and naming |
| [`conventions/visibility.md`](conventions/visibility.md) | Layer 1 / Layer 2 visibility, horse & user policies |
| [`conventions/data-fetching.md`](conventions/data-fetching.md) | TanStack Query conventions |
| [`conventions/loading-states.md`](conventions/loading-states.md) | Mandatory section loading pattern |
| [`conventions/error-handling.md`](conventions/error-handling.md) | Error boundaries, API/auth failure patterns |
| [`conventions/i18n.md`](conventions/i18n.md) | Locales, navigation, language preference |
| [`conventions/ui-styling.md`](conventions/ui-styling.md) | shadcn/ui, semantic colors, toasts, forms |
| [`conventions/testing.md`](conventions/testing.md) | Vitest conventions |
| [`conventions/mongodb-models.md`](conventions/mongodb-models.md) | Model naming, lifecycle, ownership |

## Engineering — implementation guides

### Architecture & Stack

| Doc | Purpose |
|-----|---------|
| [`engineering/stack.md`](engineering/stack.md) | Technical stack, architecture principles, folder structure |
| [`engineering/theme-default-palette.md`](engineering/theme-default-palette.md) | Default theme palette brief (forest / warm accent); live tokens in `app/globals.css` |
| [`engineering/page-flow-blueprint.md`](engineering/page-flow-blueprint.md) | Canonical page pattern: shell, loading, error boundaries, parent-owned Save for Profile/Admin |
| [`engineering/component-resilience.md`](engineering/component-resilience.md) | Loading states, skeletons, ErrorBoundary stacking |
| [`engineering/errors.md`](engineering/errors.md) | Three-layer error handling (global, page, section) |
| [`engineering/i18n.md`](engineering/i18n.md) | Locales, routing, `NEXT_LOCALE` cookie |

### Auth & User

| Doc | Purpose |
|-----|---------|
| [`engineering/auth.md`](engineering/auth.md) | Web session (cookies), mobile JWT, Google bridge, token refresh |
| [`engineering/profile.md`](engineering/profile.md) | Account profile + preferences routes, `PATCH /me`, preview/Save/discard, deactivation |
| [`engineering/userAuthTodo.md`](engineering/userAuthTodo.md) | User/auth readiness checklist (UA-00 through UA-31) |
| [`engineering/dataLifecycle.md`](engineering/dataLifecycle.md) | Engineering patterns: tombstone fields, service conventions |
| [`engineering/piiAnonymization.md`](engineering/piiAnonymization.md) | GDPR PII anonymization pipeline (UA-31) |

### Entity Role APIs

| Doc | Entities Covered |
|-----|------------------|
| [`engineering/entities/horses.md`](engineering/entities/horses.md) | Horse endpoints, visibility model, media gallery, deletion requests |
| [`engineering/entities/stables.md`](engineering/entities/stables.md) | Stable endpoints, discovery visibility |
| [`engineering/entities/breeders.md`](engineering/entities/breeders.md) | Breeder endpoints, discovery visibility |
| [`engineering/entities/transports.md`](engineering/entities/transports.md) | Transport endpoints, discovery visibility |
| [`engineering/entities/riding-clubs.md`](engineering/entities/riding-clubs.md) | Riding club endpoints, discovery visibility |
| [`engineering/entities/trainers.md`](engineering/entities/trainers.md) | Trainer endpoints (user-linked) |
| [`engineering/entities/grooms.md`](engineering/entities/grooms.md) | Groom endpoints (user-linked) |
| [`engineering/entities/veterinaries.md`](engineering/entities/veterinaries.md) | Veterinary endpoints (user-linked) |
| [`engineering/entities/farriers.md`](engineering/entities/farriers.md) | Farrier endpoints (user-linked) |
| [`engineering/entities/coaches.md`](engineering/entities/coaches.md) | Coach endpoints (user-linked) |
| [`engineering/entities/riders.md`](engineering/entities/riders.md) | Rider endpoints (user-linked) |

### Horse Pages & Tabs

| Doc | Purpose |
|-----|---------|
| [`engineering/horseTabs.md`](engineering/horseTabs.md) | Horse tab structure, routes, visibility, tab order |
| [`engineering/userTabs.md`](engineering/userTabs.md) | User tab structure, routes, visibility |

### Product / competitive specs (canonical in `product/` + `features/`)

| Doc | Purpose |
|-----|---------|
| [`features/horseModule.md`](features/horseModule.md) | Horse feature spec — includes §14 first-delivery social backlog (`H-FD-*`) |
| [`features/userModule.md`](features/userModule.md) | User feature spec — includes §12 first-delivery social backlog (`U-FD-*`) |
| [`features/stableModule.md`](features/stableModule.md) | Stable feature spec — includes §12 first-delivery SaaS backlog (`S-FD-*`) |
| [`product/firstDeliveryCompetitiveBacklog.md`](product/firstDeliveryCompetitiveBacklog.md) | First delivery extract from market research |
| [`product/benchMarket/webapps.md`](product/benchMarket/webapps.md) | Full competitive benchmark (12 products, including EquineM) |

### Relationships & Ownership

| Doc | Purpose |
|-----|---------|
| [`engineering/relationships.md`](engineering/relationships.md) | Horse-to-provider relationships, invitation flow |
| [`engineering/ownershipTransfer.md`](engineering/ownershipTransfer.md) | Consent-based ownership transfer REST API |
| [`engineering/pedigreeConnections.md`](engineering/pedigreeConnections.md) | Pedigree connections and cross-references |

### Billing

| Doc | Purpose |
|-----|---------|
| [`engineering/billing.md`](engineering/billing.md) | Subscription plans, Stripe setup, webhooks, discounts, payment gating, key flows |
