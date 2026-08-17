# Equus Documentation

Canonical docs live under `equus/docs/`. **Agents:** start at repo-root [`../../AGENTS.md`](../../AGENTS.md). Use this file as an **index** — scan the table you need; do not read it top to bottom or follow every link.

| Folder | Purpose |
|--------|---------|
| [`product/`](product/) | Why / market — index [`product/businessPlan.md`](product/businessPlan.md) |
| [`features/`](features/) | What the product does |
| [`engineering/`](engineering/) | What exists (`aligned` / `drift`) |
| [`conventions/`](conventions/) | How to write (kind of change) |
| [`superpowers/`](superpowers/) | Specs → `superpowers/specs/`; plans → `superpowers/plans/` |

Human / planning onboarding order: [`product/businessPlan.md`](product/businessPlan.md) — not this file.

## Conventions (how to write)

Open **one** guide for the kind of change. Open engineering only when you need keys, routes, or Shipped/Target.

| Guide | Kind of change |
|-------|----------------|
| [`conventions/architecture.md`](conventions/architecture.md) | Layers, REST-from-UI, no Server Actions as product API |
| [`conventions/nextjs-conventions.md`](conventions/nextjs-conventions.md) | App Router, `"use client"`, imports, env |
| [`conventions/ui-layout-naming.md`](conventions/ui-layout-naming.md) | Entity UI folders, filename prefix, shared vs entity-shared |
| [`conventions/visibility.md`](conventions/visibility.md) | Layer-1/2 control + entity adapter (not keys) |
| [`conventions/data-fetching.md`](conventions/data-fetching.md) | TanStack Query hooks |
| [`conventions/loading-states.md`](conventions/loading-states.md) | Section skeletons, chrome-first |
| [`conventions/error-handling.md`](conventions/error-handling.md) | Section boundary vs toast/redirect |
| [`conventions/i18n.md`](conventions/i18n.md) | Strings, locale-aware navigation |
| [`conventions/ui-styling.md`](conventions/ui-styling.md) | shadcn, semantic tokens, toasts, forms |
| [`conventions/testing.md`](conventions/testing.md) | Vitest, `__tests__/` |
| [`conventions/mongodb-models.md`](conventions/mongodb-models.md) | Model naming, deactivate-not-delete |

## Engineering — implementation contracts

**Product/features win** for what and why. Open the file that matches the **entity or topic**. Do not copy lock tables, euro amounts, or feature-ID catalogs.

| Marker | Meaning |
|--------|---------|
| **aligned** | Shipped code matches product. Short endpoint/UI table + code roots. |
| **drift** | Shipped code disagrees with product. Read **Shipped** (do not extend dead behavior) then **Target**. |

**Do not reintroduce:** owner-pays horse tiers · people search as a module · Veterinary in the production launch gate · last-used-module as home · follow/likes/public feed.

| Doc | Status | Purpose |
|-----|--------|---------|
| [`engineering/stack.md`](engineering/stack.md) | aligned | Runtime, folders, API shape |
| [`engineering/auth.md`](engineering/auth.md) | aligned | Cookies, JWT, Google bridge |
| [`engineering/profile.md`](engineering/profile.md) | aligned | `PATCH /users/me`, preferences, deactivate |
| [`engineering/users.md`](engineering/users.md) | aligned | User hub/view |
| [`engineering/userTabs.md`](engineering/userTabs.md) | aligned | Account tabs |
| [`engineering/myGraph.md`](engineering/myGraph.md) | drift | `/home` inbox |
| [`engineering/favorites.md`](engineering/favorites.md) | drift | `User.favorites` (not built) |
| [`engineering/chat.md`](engineering/chat.md) | drift | User-to-user chat (not built) |
| [`engineering/horses.md`](engineering/horses.md) | drift | Horse REST; ops writes |
| [`engineering/horseTabs.md`](engineering/horseTabs.md) | aligned | Horse tab routes + `allowedTabs` |
| [`engineering/stables.md`](engineering/stables.md) | aligned | Stable REST (profile); ops greenfield |
| [`engineering/later-modules.md`](engineering/later-modules.md) | aligned | Post-launch entity CRUD |
| [`engineering/relationships.md`](engineering/relationships.md) | aligned | Horse ↔ provider |
| [`engineering/workplace.md`](engineering/workplace.md) | aligned | User ↔ host collab |
| [`engineering/ownershipTransfer.md`](engineering/ownershipTransfer.md) | drift | Consent ownership; horse payer |
| [`engineering/pedigreeConnections.md`](engineering/pedigreeConnections.md) | aligned | Sire/dam consent |
| [`engineering/billing.md`](engineering/billing.md) | drift | Entity subscription how; do not extend owner-tier |
| [`engineering/dataLifecycle.md`](engineering/dataLifecycle.md) | aligned | Tombstones; file-asset exception |
| [`engineering/piiAnonymization.md`](engineering/piiAnonymization.md) | aligned | GDPR scrub |
| [`engineering/i18n.md`](engineering/i18n.md) | drift | Locales (`pt` missing) |
| [`engineering/page-flow-blueprint.md`](engineering/page-flow-blueprint.md) | aligned | Page/shell/Save/loading file map |
| [`engineering/errors.md`](engineering/errors.md) | aligned | Error-boundary files |
| [`engineering/theme-default-palette.md`](engineering/theme-default-palette.md) | aligned | Default theme hex brief |
