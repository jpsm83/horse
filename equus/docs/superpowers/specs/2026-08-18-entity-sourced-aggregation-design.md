# Entity-sourced Planning / Documents / History aggregation — Design

Date: 2026-08-18  
Status: approved for planning  
Related: [`../../engineering/horses.md`](../../engineering/horses.md) · [`../../features/horseModule.md`](../../features/horseModule.md) H-PLAN-01 · stable SaaS [`2026-08-18-stable-saas-ops-design.md`](2026-08-18-stable-saas-ops-design.md)

## Problem

Horse Planning POST is limited to owner personal events. Stable ops write entity-sourced `HorseEvent` rows and stable documents/invoices, but horse read surfaces do not consistently aggregate them. Legacy DB rows may have `sourceEntityType` / `sourceEntityId` from before Block 14 narrowed the write path.

## Goal

1. **Planning:** `GET /api/v1/horses/:id/planning` returns merged calendar: owner personal events + entity-sourced events (read-only on horse).
2. **Documents:** `GET /api/v1/horses/:id/documents` includes stable-uploaded docs (and invoice PDFs if applicable) with entity source metadata.
3. **History/audit:** `GET /api/v1/horses/:id/audit` includes entity-attributed entries where applicable.
4. **Migrate/normalize** legacy `HorseEvent` rows with partial or inconsistent source fields.
5. Horse **POST planning** unchanged — owner personal events only; no reintroduction of entity fields on horse create form.

**Chat reply UX** stays in plan #3 — aggregation only displays entity events and exposes `sourceEntityId` for Message button.

## Prerequisites

- Stable SaaS sub-plans (especially whiteboard, documents, finance, feed) writing rows with consistent `sourceEntityType: "stable"`, `sourceEntityId`.
- Chat plan #3 for Planning Message button (may ship before or after aggregation; button hidden until `sourceEntityId` present).

---

## Read contract

### Planning item DTO (extended)

```ts
type HorsePlanningItem = {
  id: string;
  eventType: string;
  title: string;
  startDate: string;
  // ...existing fields
  source?: {
    entityType: "stable" | string;
    entityId: string;
    entityLabel?: string;
  };
  editableByViewer: boolean;  // false for entity-sourced when viewer is owner on horse
};
```

### Documents item DTO (extended)

```ts
type HorseDocumentItem = {
  id: string;
  title: string;
  url: string;
  source?: { entityType: string; entityId: string };
  kind: "owner" | "entity" | "invoice";
};
```

### Audit entries

Append synthetic or stored audit rows when stable ops mutate horse-attached data (`stable_activity_created`, `stable_invoice_sent`, etc.) — use existing audit collection patterns in `horseService.getHorseAudit`.

---

## Legacy migration

One-time script or startup migration task:

- Find `HorseEvent` where `sourceEntityType` or `sourceEntityId` set but incomplete → normalize to `stable` + valid ObjectId or clear orphan source if entity deleted
- `feeding` events from legacy stable ops: keep read-only display

File: `equus/lib/migrations/normalizeEntitySourcedHorseEvents.ts` — idempotent.

---

## Visibility

- Entity-sourced events follow horse L1/L2 visibility same as owner events on read
- Owner portal access rules (`ownerPortalAccess.ts`) gate document/invoice visibility when stable write-locked

---

## Non-goals

- Owner editing entity events on horse
- Horse POST accepting `sourceEntityType` / `sourceEntityId`
- Aggregating non-stable entity types until those modules ship

---

## Acceptance criteria

- [ ] Horse planning list shows owner + stable events sorted by date
- [ ] Entity events marked read-only for owner on horse UI
- [ ] Documents list includes stable docs + invoices
- [ ] Audit includes entity ops entries
- [ ] Legacy events migrated
- [ ] `engineering/horses.md` **aligned**
