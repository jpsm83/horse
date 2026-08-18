# Stable SaaS ops — Design (umbrella)

Date: 2026-08-18  
Status: approved for planning  
Related: [`../../features/stableModule.md`](../../features/stableModule.md) · [`../../engineering/stables.md`](../../engineering/stables.md) · [`../../engineering/billing.md`](../../engineering/billing.md) · [`../../engineering/horses.md`](../../engineering/horses.md)

## Problem

Stable module has profile/discovery REST only. EquineM-parity ops (roster, documents, finance, whiteboard, feed, owner portal) are documented but unbuilt. Horse Planning/Documents are display-only until stable writes exist.

## Goal

Deliver stable **write surfaces** in **6 phased sub-plans**, feeding horse read aggregation (plan #6):

| Phase | Sub-plan | Primary feature IDs |
|-------|----------|---------------------|
| 1 | Roster | S-HORSE-01–09, S-HORSE-16–18, S-LIST-01 |
| 2 | Documents | S-HORSE-12–13, S-FD-09 |
| 3 | Finance | S-FIN-01–06, S-FIN-14 |
| 4 | Whiteboard | S-ACT-01–06, S-ACT-11–13, S-FD-03 |
| 5 | Feed | S-FEED-01–06, S-FEED-10 |
| 6 | Owner portal | S-REL-06, S-HORSE-17, S-ACT-23 (display contract) |

**Prerequisite:** Plan #1 waiting-transfer (S-HORSE-18 API) should be done; roster UI uses that API for Path B create.

## Architecture principles

1. **Ops writes on Stable** — new routes under `/api/v1/stables/:stableId/...`
2. **Horse displays** — entity-created rows carry `sourceEntityType: "stable"`, `sourceEntityId`; horse GET endpoints aggregate (plan #6)
3. **Good standing** — all mutating stable ops call `assertStableWriteAllowed(stableId, actorUserId)` from `lib/billing/entityWriteGuard.ts`
4. **Collaborator access** — active `WorkplaceRelationship` + accepted horse↔stable `Relationship` for horse-scoped actions
5. **Owner portal** — owners see their horses' stable data while subscription good standing; read survives write-lock

## Shared models (introduced across phases)

| Model | Phase | Purpose |
|-------|-------|---------|
| `StableRosterEntry` | Roster | Hosted horse membership (arrival, departure, stall) |
| `StableDocument` | Documents | Files/metadata linked to horse + stable |
| `StableInvoice` | Finance | Invoice header + line items |
| `StableActivity` | Whiteboard | Tasks/appointments (maps to `HorseEvent` when horse-attached) |
| `StableFeedSchedule` | Feed | Per-horse feed entries |

Exact schemas defined in each sub-plan spec section.

## Stable UI tabs (target)

Extend `getStableTabs` beyond Hub/Profile/Admin:

| Tab | Phase |
|-----|-------|
| Roster | 1 |
| Documents | 2 |
| Finance | 3 |
| Planning (whiteboard) | 4 |
| Feed | 5 |
| (Owner portal is horse-side read, not stable tab) | 6 |

## Roster meter

Update `rosterMeter.countStableRoster` to include waiting-transfer horses (plan #1) per billing.md Target.

## Out of scope (all phases)

- Full EquineM Sections 1–9 parity in one release
- Facility booking (S-FAC-*), Peppol (S-FD-14), CRM (S-FD-12)
- Veterinary/trainer paid modules
- Portuguese locale

## Sub-plan files

Execute in order — each sub-plan is independently testable:

1. [`../plans/2026-08-18-stable-saas-roster.md`](../plans/2026-08-18-stable-saas-roster.md)
2. [`../plans/2026-08-18-stable-saas-documents.md`](../plans/2026-08-18-stable-saas-documents.md)
3. [`../plans/2026-08-18-stable-saas-finance.md`](../plans/2026-08-18-stable-saas-finance.md)
4. [`../plans/2026-08-18-stable-saas-whiteboard.md`](../plans/2026-08-18-stable-saas-whiteboard.md)
5. [`../plans/2026-08-18-stable-saas-feed.md`](../plans/2026-08-18-stable-saas-feed.md)
6. [`../plans/2026-08-18-stable-saas-owner-portal.md`](../plans/2026-08-18-stable-saas-owner-portal.md)

## Acceptance (umbrella)

- [ ] Stable in good standing can run roster → docs → finance → whiteboard → feed workflows
- [ ] Write-lock blocks mutating ops; owners still read saved horse-attached data
- [ ] Entity-written rows appear on horse surfaces after plan #6
- [ ] `engineering/stables.md` Target ops marked shipped per phase
