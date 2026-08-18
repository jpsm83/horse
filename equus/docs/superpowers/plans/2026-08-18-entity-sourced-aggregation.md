# Entity-sourced aggregation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Aggregate entity-written Planning, Documents, and History on horse read APIs; migrate legacy HorseEvent source fields.

**Architecture:** Extend `horseService` list/get helpers; join stable-written collections; migration script; UI read-only badges on Planning/Documents.

**Tech Stack:** Mongoose, Vitest, existing horse tab components.

## Global Constraints

- Spec: [`../specs/2026-08-18-entity-sourced-aggregation-design.md`](../specs/2026-08-18-entity-sourced-aggregation-design.md)
- Prerequisite: stable SaaS sub-plans complete (writes exist)
- Do **not** extend horse POST planning schema with entity source fields
- Work from `equus/`; colocated tests

---

### Task 1: Legacy migration

**Files:**
- Create: `equus/lib/migrations/normalizeEntitySourcedHorseEvents.ts`
- Test: `equus/lib/migrations/__tests__/normalizeEntitySourcedHorseEvents.test.ts`

- [ ] **Step 1: Test normalizes partial source fields and skips valid rows**

- [ ] **Step 2: Implement idempotent migration**

- [ ] **Step 3: Run migration in test suite setup or one-shot npm script `npm run migrate:horse-events`**

- [ ] **Step 4: Commit**

---

### Task 2: Planning aggregation service

**Files:**
- Modify: `equus/lib/services/horseService.ts` (`listPlanningItems` or equivalent)
- Create: `equus/lib/horses/aggregatePlanningItems.ts`
- Test: `equus/lib/horses/__tests__/aggregatePlanningItems.test.ts`

- [ ] **Step 1: Test merges owner events + entity-sourced HorseEvents sorted by startDate**

- [ ] **Step 2: Set `editableByViewer: false` when `sourceEntityId` present and viewer not entity operator**

- [ ] **Step 3: Include `source.entityLabel` from stable trade name**

- [ ] **Step 4: Commit**

---

### Task 3: Documents + audit aggregation

**Files:**
- Modify: horse documents list in `horseService.ts`
- Modify: audit builder
- Test: colocated tests

- [ ] **Step 1: Union owner documents + StableDocument + StableInvoice references**

- [ ] **Step 2: Audit entries for stable ops actions**

- [ ] **Step 3: Commit**

---

### Task 4: REST route updates (if DTO mapping in routes)

**Files:**
- Modify: `equus/app/api/v1/horses/[id]/planning/route.ts`
- Modify: documents and audit routes if they map DTOs locally

- [ ] **Step 1: Route tests assert merged payload shape**

- [ ] **Step 2: Commit**

---

### Task 5: Horse UI — read-only entity badges

**Files:**
- Modify: `equus/components/horses/planning/` (event list rows)
- Modify: documents list component
- Modify: `messages/en.json`, `es.json`

- [ ] **Step 1: Show “From [Stable name]” badge; disable edit for entity events**

- [ ] **Step 2: Message button visible when chat plan shipped + sourceEntityId set**

- [ ] **Step 3: Commit**

---

### Task 6: Docs + verification

- [ ] Update `equus/docs/engineering/horses.md` → aligned
- [ ] `npm test` && `npm run lint`
- [ ] Manual: stable creates activity → appears on horse Planning read-only

**Done when:** acceptance criteria in spec checked.
