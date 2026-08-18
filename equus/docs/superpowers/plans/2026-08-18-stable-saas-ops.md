# Stable SaaS ops — Umbrella Implementation Plan

> **For agentic workers:** Execute **one sub-plan at a time** in order. Read this umbrella first, then open the next pending sub-plan file.

**Goal:** Ship stable ops in six phases (roster → documents → finance → whiteboard → feed → owner portal).

**Architecture:** Stable-scoped REST + services; `assertStableWriteAllowed` on writes; horse display via `sourceEntity*` fields (aggregation plan #6).

**Tech Stack:** Next.js, Mongoose, Zod, Vitest, TanStack Query, Cloudinary (documents).

## Global Constraints

- Umbrella spec: [`../specs/2026-08-18-stable-saas-ops-design.md`](../specs/2026-08-18-stable-saas-ops-design.md)
- Prerequisite: [`2026-08-18-waiting-transfer.md`](2026-08-18-waiting-transfer.md) complete
- Work from `equus/`; colocated `__tests__/`
- [`../../engineering/billing.md`](../../engineering/billing.md) — use `entityWriteGuard`, update roster meter for waiting-transfer

---

## Sub-plan execution order

| # | File | Status |
|---|------|--------|
| 1 | [`2026-08-18-stable-saas-roster.md`](2026-08-18-stable-saas-roster.md) | pending |
| 2 | [`2026-08-18-stable-saas-documents.md`](2026-08-18-stable-saas-documents.md) | pending |
| 3 | [`2026-08-18-stable-saas-finance.md`](2026-08-18-stable-saas-finance.md) | pending |
| 4 | [`2026-08-18-stable-saas-whiteboard.md`](2026-08-18-stable-saas-whiteboard.md) | pending |
| 5 | [`2026-08-18-stable-saas-feed.md`](2026-08-18-stable-saas-feed.md) | pending |
| 6 | [`2026-08-18-stable-saas-owner-portal.md`](2026-08-18-stable-saas-owner-portal.md) | pending |

**Rule:** Do not start sub-plan N+1 until sub-plan N is marked done in this table.

---

## Shared setup (once, in sub-plan 1 Task 1)

Sub-plan 1 owns creating:

- `lib/stables/stableAccess.ts` — `assertStableOpsAccess(stableId, userId, horseId?)` combining ownership, workplace, horse relationship
- Extend `lib/billing/rosterMeter.ts` for waiting-transfer count
- `lib/stables/stableTabs.ts` — tab registry extensible by phase

Later sub-plans import these helpers; do not duplicate.

---

## Prompt to execute next sub-plan

```
Execute the next pending sub-plan under equus/docs/superpowers/plans/2026-08-18-stable-saas-ops.md.

Read the umbrella spec and the sub-plan file. Follow global constraints. When finished, update the sub-plan status table in the umbrella file and engineering/stables.md Shipped section.
```

---

## After all sub-plans

Proceed to [`2026-08-18-entity-sourced-aggregation.md`](2026-08-18-entity-sourced-aggregation.md).
