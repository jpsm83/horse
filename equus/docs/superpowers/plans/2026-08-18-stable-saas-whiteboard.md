# Stable SaaS — Whiteboard sub-plan

> **Parent:** [`2026-08-18-stable-saas-ops.md`](2026-08-18-stable-saas-ops.md)

**Goal:** Daily tasks/activities per horse; creates `HorseEvent` rows with entity source for Planning display.

**Feature IDs:** S-ACT-01–06, S-ACT-11–13, S-FD-03, S-ACT-23 (write side)

**Prerequisite:** Finance sub-plan done.

---

### Task 1: StableActivity model + HorseEvent sync

**Files:**
- Create: `equus/models/StableActivity.ts`
- Create: `equus/lib/services/stableActivityService.ts`
- Modify: `equus/models/HorseEvent.ts` if needed
- Test: `equus/lib/services/__tests__/stableActivityService.test.ts`

On create/update activity with `horseId`:

- Write/update linked `HorseEvent` with `sourceEntityType: "stable"`, `sourceEntityId: stableId`
- Owner cannot edit via horse POST (existing rule)

- [ ] Commit

### Task 2: REST routes

**Files:**
- Create: `equus/app/api/v1/stables/[id]/activities/route.ts`
- Create: `equus/app/api/v1/stables/[id]/activities/[activityId]/route.ts`

- [ ] List with filters (horse, date range, staff assignee)
- [ ] Commit

### Task 3: Planning/whiteboard tab UI

**Files:**
- Create: `equus/app/[locale]/stables/[stableId]/planning/page.tsx`
- Create: `equus/components/stables/planning/` — daily list view (drag-drop deferred)

- [ ] Create/complete activities; filter by horse
- [ ] Commit

### Task 4: Docs + umbrella status

- [ ] Mark sub-plan 4 **done**
