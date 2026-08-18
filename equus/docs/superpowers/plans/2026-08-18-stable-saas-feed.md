# Stable SaaS — Feed sub-plan

> **Parent:** [`2026-08-18-stable-saas-ops.md`](2026-08-18-stable-saas-ops.md)

**Goal:** Per-horse feed schedules; log deliveries; surface on horse Planning as entity-sourced feeding events.

**Feature IDs:** S-FEED-01–06, S-FEED-10

**Prerequisite:** Whiteboard sub-plan done.

---

### Task 1: StableFeedSchedule model + service

**Files:**
- Create: `equus/models/StableFeedSchedule.ts`
- Create: `equus/lib/services/stableFeedService.ts`
- Test: `equus/lib/services/__tests__/stableFeedService.test.ts`

```ts
// stableId, horseId, feedType, quantity, scheduleCronOrTimes[], supplements[], active
```

- [ ] CRUD schedules; log feeding creates HorseEvent type `feeding` with entity source
- [ ] Commit

### Task 2: REST routes

**Files:**
- Create: `equus/app/api/v1/stables/[id]/horses/[horseId]/feed/route.ts`

- [ ] GET schedule, PATCH update, POST log delivery
- [ ] Commit

### Task 3: Feed tab UI

**Files:**
- Create: `equus/app/[locale]/stables/[stableId]/feed/page.tsx`
- Create: `equus/components/stables/feed/`

- [ ] Stable-wide feed overview + per-horse edit
- [ ] Commit

### Task 4: Docs + umbrella status

- [ ] Mark sub-plan 5 **done**
