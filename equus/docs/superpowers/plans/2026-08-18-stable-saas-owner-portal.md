# Stable SaaS — Owner portal sub-plan

> **Parent:** [`2026-08-18-stable-saas-ops.md`](2026-08-18-stable-saas-ops.md)

**Goal:** Owners read stable-written data for **their horses** while stable good standing; read persists after write-lock.

**Feature IDs:** S-REL-06, S-HORSE-17, owner-facing contract for S-ACT-23 / S-FIN-14 / S-FEED-10

**Prerequisite:** Feed sub-plan done. **Next:** entity-sourced aggregation plan #6.

---

### Task 1: Owner read access rules

**Files:**
- Create: `equus/lib/horses/ownerPortalAccess.ts`
- Test: `equus/lib/horses/__tests__/ownerPortalAccess.test.ts`

```ts
export async function assertOwnerCanViewStableOpsData(
  viewerUserId: string,
  horseId: string,
  stableId: string,
): Promise<{ allowed: boolean; reason?: "write_locked" | "no_relationship" }>
```

- Owner with accepted horse↔stable relationship can **read** even if stable write-locked
- Good standing affects **live updates** only, not tombstoned history

- [ ] Commit

### Task 2: Owner portal API slice

**Files:**
- Create: `equus/app/api/v1/horses/[id]/stable-portal/route.ts`

Response bundles read DTOs: recent activities, open invoices, feed summary, document count — scoped to hosting stable(s).

- [ ] Tests for owner vs stranger vs write-locked stable
- [ ] Commit

### Task 3: Horse hub portal section (optional v1 strip)

**Files:**
- Modify horse hub components — “Stable care” section when owner + hosting relationship + data exists

- [ ] Link to Planning/Documents tabs
- [ ] Commit

### Task 4: Docs + umbrella completion

- [ ] Update `stableModule.md` / `engineering/stables.md`
- [ ] Mark sub-plan 6 **done** in umbrella
- [ ] All stable SaaS sub-plans complete → start [`2026-08-18-entity-sourced-aggregation.md`](2026-08-18-entity-sourced-aggregation.md)

### Verification

- [ ] Owner sees portal data while stable good standing
- [ ] After write-lock, owner still sees saved history (no new writes)
