<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Equus — Next.js Application

**Equus** is a **Next.js 16** (App Router) app whose primary deliverable is a **backend REST API** shared by clients: React 19 web UI today and a planned **React Native** app on the **same REST API**. Business logic lives in `lib/`; route handlers and web screens are thin API consumers.

The web UI is an API consumer of `/api/v1`, the same contract a React Native app will use. Do not call `lib/services` or `models` from pages, layouts, or components (type-only imports are fine). Only route handlers talk to services.

## Essential commands

Run from `equus/`:

* `npm test` / `npm run test:watch` — Vitest
* `npm run build` / `npm run dev` / `npm run start` — production build (typecheck), dev, start
* `npm run lint` — ESLint
* `npm run ui:sync` — refresh shadcn/ui into `components/ui/`

## Critical business rules

- **Entity must be Equus user:** External entities (vet, stable, groomer, trainer, etc.) cannot interact with a horse in-app unless they have an Equus account and a claimed entity profile. Email invites create pending relationships that activate only after signup + profile claim.
- **Horses can work with anyone:** Real-world relationships with non-users are allowed; for those, the app exposes only Hub. Medical, Feed, Events, Documents, etc. require in-app entity connections.
- **Docs encode this asymmetry:** Entities must join to participate; horses have no such restriction.

## How to use documentation (agents)

Do **not** load the full docs tree by default.

1. Before coding in an area, open **only** the matching guide under [`docs/conventions/`](docs/conventions/).
2. For product/feature/engineering detail, open **only** the relevant file from the index [`docs/README.md`](docs/README.md) — do not ingest the whole index unless you need to discover which doc to open.
3. **Superpowers:** write specs to `docs/superpowers/specs/` and plans to `docs/superpowers/plans/` (`YYYY-MM-DD-<topic>[-design].md`).

## Engineering approach

Project facts and conventions in this file always apply. *How* to work (goals, strict rules, decision priority) is defined by the `senior-engineer` agent: `.opencode/agents/senior-engineer.md` at the repo root (default OpenCode agent).
