# Equus Documentation

Canonical docs for product and engineering decisions.

## Read in this order

| Document | Purpose |
|----------|---------|
| [`businessPlan.md`](businessPlan.md) | Product vision, domain rules, monetization, phased roadmap |
| [`stack.md`](stack.md) | **Technical stack** — architecture, auth, API, UI, data |
| [`mvpScope.md`](mvpScope.md) | Phase 1A/1B scope and explicit exclusions |
| [`validationPlaybook.md`](validationPlaybook.md) | Pre-build customer interviews and go/no-go |
| [`productFlows.md`](productFlows.md) | Onboarding and core user journeys |
| [`userAndRoles.md`](userAndRoles.md) | One login, optional roles, per-horse discovery |
| [`metricsSpec.md`](metricsSpec.md) | Internal business metrics (Phase 1B) |

## Equus app docs (`equus/documentation/`)

| Document | Purpose |
|----------|---------|
| [`equus/documentation/auth.md`](../equus/documentation/auth.md) | Web + API session, token refresh, Google bridge |
| [`equus/documentation/i18n.md`](../equus/documentation/i18n.md) | Locales, routing, `NEXT_LOCALE` cookie |
| [`equus/documentation/profile.md`](../equus/documentation/profile.md) | Profile page UI, loading/skeleton, `PATCH /me`, clear fields |

## Technical stack (summary)

See [`stack.md`](stack.md) for full detail.

- **Web:** Next.js, TypeScript, shadcn/ui, Tailwind, Zod
- **Mobile:** React Native (Expo) — same REST API as web
- **API:** REST via Next.js Route Handlers (`/api/v1/*`)
- **Auth:** Auth.js (web) + JWT endpoints (mobile)
- **Data:** MongoDB Atlas + Mongoose (`equus/models/`)
- **Media:** Cloudinary
- **Language:** 100% TypeScript

**Not used:** NestJS, Fastify (separate server), Redis (MVP), Python, PostgreSQL (MVP).
