# Stable SaaS — Roster sub-plan

> **Parent:** [`2026-08-18-stable-saas-ops.md`](2026-08-18-stable-saas-ops.md) · **Spec:** [`../specs/2026-08-18-stable-saas-ops-design.md`](../specs/2026-08-18-stable-saas-ops-design.md)

**Goal:** Hosted horse roster, Path B create UI, roster tab, meter includes waiting-transfer.

**Feature IDs:** S-HORSE-01–09, S-HORSE-16–18, S-LIST-01

## Global Constraints

- `assertStableWriteAllowed` on POST/PATCH/DELETE
- Path B create calls existing waiting-transfer `POST /horses` extension
- Work from `equus/`

---

### Task 1: Shared stable ops access + roster meter

**Files:**
- Create: `equus/lib/stables/stableAccess.ts`
- Modify: `equus/lib/billing/rosterMeter.ts`
- Test: `equus/lib/stables/__tests__/stableAccess.test.ts`

- [ ] Implement `assertStableOpsAccess`, `canViewStableRoster`
- [ ] Include waiting-transfer horses in roster count
- [ ] Commit

### Task 2: StableRosterEntry model + service

**Files:**
- Create: `equus/models/StableRosterEntry.ts`
- Create: `equus/lib/services/stableRosterService.ts`
- Test: `equus/lib/services/__tests__/stableRosterService.test.ts`

```ts
// StableRosterEntry: stableId, horseId, status: active|departed, arrivedAt, departedAt?, stallLabel?, ownerSnapshot?
```

- [ ] List active roster, add from accepted relationship, mark departed
- [ ] Commit

### Task 3: REST routes

**Files:**
- Create: `equus/app/api/v1/stables/[id]/roster/route.ts`
- Create: `equus/app/api/v1/stables/[id]/roster/[horseId]/route.ts`
- Test: colocated `__tests__/route.test.ts`

- [ ] GET list, POST add (horse must have accepted stable relationship), PATCH depart
- [ ] Commit

### Task 4: Roster tab UI

**Files:**
- Create: `equus/app/[locale]/stables/[stableId]/roster/page.tsx`
- Create: `equus/components/stables/roster/stable-roster-page.tsx`
- Modify: stable tabs config
- Modify: `messages/en.json`, `es.json`

- [ ] Table of hosted horses + actions
- [ ] “Add boarded horse” form → waiting-transfer POST when owner email provided
- [ ] Commit

### Task 5: Docs

- [ ] Update `engineering/stables.md` roster section → shipped
- [ ] Mark sub-plan 1 **done** in umbrella table

### Verification

- [ ] `npm test` && manual: add horse to roster, create waiting-transfer horse from stable
