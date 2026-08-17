<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `equus/node_modules/next/dist/docs/` before writing any Equus Next.js code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Equus — agent recipe

This file is the **start of every session** (Cursor and OpenCode). App code lives in `equus/`.

**Equus** is a **Next.js 16** (App Router) app whose primary deliverable is a **backend REST API** shared by clients: React 19 web UI today and a planned **React Native** app on the **same REST API**. Business logic lives in `equus/lib/`. Route handlers and web screens are thin API consumers.

The web UI calls `/api/v1`. Do not call `lib/services` or `models` from pages, layouts, or components (`import type` is fine). Only `equus/app/api/**/route.ts` talks to services.

## Commands (from `equus/`)

* `npm test` / `npm run test:watch` — Vitest
* `npm run build` / `npm run dev` / `npm run start` — typecheck build, dev, start
* `npm run lint` — ESLint
* `npm run ui:sync` — refresh shadcn/ui into `components/ui/`

## Critical business rules

- **Entity must be Equus user:** Vets, stables, grooms, trainers, etc. cannot act on a horse in-app unless they have an Equus account and a claimed entity profile. Email invites stay pending until signup + claim.
- **Horses can work with anyone:** Real-world links to non-users are allowed; those viewers get Hub only. Medical, Feed, Events, Documents, etc. require in-app entity connections.

## What to do with docs

Do **not** load `equus/docs/` wholesale. Open **only** files this task needs. Skip **Also open** rows whose condition is false.

1. **Kind of change** (layers, Query, skeletons, i18n, models, …) → one file under [`equus/docs/conventions/`](equus/docs/conventions/). Pick the filename from the **Conventions** table in [`equus/docs/README.md`](equus/docs/README.md) (scan that table only).
2. **Entity / topic that exists** (horse REST, auth, tabs, billing, …) → one file under [`equus/docs/engineering/`](equus/docs/engineering/) (Engineering table in the same README). On **drift**, read **Shipped** then **Target**. Do not extend dead behavior (owner-tier billing, people search, Veterinary-in-launch-gate).
3. **Product behavior / scope** → [`equus/docs/features/`](equus/docs/features/) or [`equus/docs/product/`](equus/docs/product/) only when the task changes what the product does. Human onboarding order: [`equus/docs/product/businessPlan.md`](equus/docs/product/businessPlan.md).
4. **Superpowers** (installed for Cursor and OpenCode): follow the **matching** skill for this task (brainstorming, TDD, debugging, …). Do not load every skill. Specs → `equus/docs/superpowers/specs/`; plans → `equus/docs/superpowers/plans/` (`YYYY-MM-DD-<topic>[-design].md`).

## How to work

**senior-engineer** is **opt-in** (not the default). Use it when you want the full how-to-work rules (root-cause, file headers, workflow). Shared prompt: [`agents/senior-engineer.md`](agents/senior-engineer.md).

* **Cursor:** `@senior-engineer` in the prompt (manual rule — not auto-attached, not agent-requested).
* **OpenCode:** select the **senior-engineer** agent in the agent picker (Tab) before you prompt.
