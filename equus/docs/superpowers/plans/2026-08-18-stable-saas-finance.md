# Stable SaaS — Finance sub-plan

> **Parent:** [`2026-08-18-stable-saas-ops.md`](2026-08-18-stable-saas-ops.md)

**Goal:** Create/send/track invoices per horse/owner; invoices visible on horse Documents after aggregation plan.

**Feature IDs:** S-FIN-01–06, S-FIN-14

**Prerequisite:** Documents sub-plan done.

---

### Task 1: StableInvoice model + service

**Files:**
- Create: `equus/models/StableInvoice.ts`
- Create: `equus/lib/services/stableInvoiceService.ts`
- Test: `equus/lib/services/__tests__/stableInvoiceService.test.ts`

```ts
// stableId, horseId, ownerUserId?, status: draft|sent|paid, lineItems[], totalCents, currency, dueDate
```

- [ ] CRUD draft, mark sent, mark paid
- [ ] Commit

### Task 2: REST routes

**Files:**
- Create: `equus/app/api/v1/stables/[id]/invoices/route.ts`
- Create: `equus/app/api/v1/stables/[id]/invoices/[invoiceId]/route.ts`

- [ ] List/filter by horse; create; update status
- [ ] Commit

### Task 3: Finance tab UI

**Files:**
- Create: `equus/app/[locale]/stables/[stableId]/finance/page.tsx`
- Create: `equus/components/stables/finance/`

- [ ] Invoice list + create form + status actions
- [ ] Commit

### Task 4: Email invoice to owner (optional v1)

- [ ] Use existing email infra to notify owner when invoice marked sent

### Task 5: Docs + umbrella status

- [ ] Mark sub-plan 3 **done**
