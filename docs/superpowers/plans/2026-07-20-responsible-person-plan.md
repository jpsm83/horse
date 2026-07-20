# Horse Responsible Person Role — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add "responsible person" role to horses. Extend admin tabs (Edit, Connect) to co-owners and responsible persons. Main owner retains exclusive Admin tab for ownership/responsible management.

**Architecture:** Extends existing OwnershipTransfer consent model with `add_responsible`/`remove_responsible` transfer kinds. Server computes `isMainOwner`, `isCoOwner`, `isResponsible`, `isAdmin` flags in `OwnerHorseHubSummary`. EntityTabs uses dual filtering (`isAdmin` + `isMainOwner`). HorsePageShell uses dual gating (`requireOwnership` + `requireMainOwner`).

**Tech Stack:** Next.js 16, TypeScript, Mongoose, TanStack Query, React Hook Form, shadcn/ui

## Global Constraints

- Consent-based: responsible person assignments use invite/accept flow (OwnershipTransfer)
- Only main owner can add/remove responsible persons
- Entity-owned roles only — no User model changes for horse relations
- Follow existing test patterns (Vitest, mongodb-memory-server)
- No hard deletes; use consent-based status changes

---

### Task 1: Data Model — Enums, Horse Schema, API Types

**Files:**
- Modify: `equus/utils/enums.ts` — `ownershipTransferKindEnums`
- Modify: `equus/models/Horse.ts` — add `responsibles` field
- Modify: `equus/lib/api/horseClient.ts` — update `OwnerHorseHubSummary` type

**Interfaces:**
- Produces: `"add_responsible"`, `"remove_responsible"` in `ownershipTransferKindEnums`
- Produces: `horse.responsibles` array of `{ userId: ObjectId }`
- Produces: `OwnerHorseHubSummary` extended with `isCoOwner: boolean`, `isResponsible: boolean`, `isAdmin: boolean`, `responsibles: Array<{ userId: string; label: string }>`

- [ ] **Step 1: Add `add_responsible` and `remove_responsible` to ownershipTransferKindEnums in `equus/utils/enums.ts`**
- [ ] **Step 2: Add `responsibles` field to Horse schema in `equus/models/Horse.ts`**
- [ ] **Step 3: Update `OwnerHorseHubSummary` type in `equus/lib/api/horseClient.ts`**
- [ ] **Step 4: Run build to verify**
- [ ] **Step 5: Commit**

---

### Task 2: Access Helpers — Include Responsibles

**Files:**
- Modify: `equus/lib/ownership/entityOwnership.ts` — `ownedByUserQuery`, `userOwnsEntity`, `userHasOwnerAccess`
- Modify: `equus/tests/lib/ownership/entityOwnership.test.ts` — add responsible person tests

**Interfaces:**
- Consumes: `horse.responsibles` field from Task 1
- Produces: `ownedByUserQuery()` includes `$or: [{ "responsibles.userId": objectId }]`
- Produces: `userOwnsEntity()`, `userHasOwnerAccess()` include responsibles check

- [ ] **Step 1: Update 3 functions in `entityOwnership.ts` to include responsibles**
- [ ] **Step 2: Add tests in `entityOwnership.test.ts` for responsible person access**
- [ ] **Step 3: Run the test to verify**
- [ ] **Step 4: Commit**

---

### Task 3: Server Role Computation — horseService.ts

**Files:**
- Modify: `equus/lib/services/horseService.ts` — `getOwnerHorseHubSummary`
- Modify: `equus/hooks/queries/useHorse.ts` — update return types

**Interfaces:**
- Consumes: `horse.responsibles` field from Task 1
- Produces: `isCoOwner`, `isResponsible`, `isAdmin`, `responsibles` in `OwnerHorseHubSummary`

- [ ] **Step 1: Compute `isCoOwner`, `isResponsible`, `isAdmin` in `getOwnerHorseHubSummary`**
- [ ] **Step 2: Resolve responsible person labels and include in response**
- [ ] **Step 3: Add role flag types in return statement**
- [ ] **Step 4: Run build to verify**
- [ ] **Step 5: Commit**

---

### Task 4: Ownership Transfer — Handle Add/Remove Responsible

**Files:**
- Modify: `equus/lib/services/ownershipTransferService.ts` — validation + accept handler
- Create: `equus/tests/lib/services/ownershipTransferService.responsible.test.ts` — integration tests

**Interfaces:**
- Consumes: `add_responsible`, `remove_responsible` enums from Task 1
- Produces: transfer creation and acceptance for responsible persons

- [ ] **Step 1: Add validation for `add_responsible` in `createOwnershipTransfer`**
- [ ] **Step 2: Add validation for `remove_responsible` in `createOwnershipTransfer`**
- [ ] **Step 3: Handle accept in `acceptOwnershipTransfer` for both kinds**
- [ ] **Step 4: Write integration tests (add, remove, unauthorized)**
- [ ] **Step 5: Run tests to verify**
- [ ] **Step 6: Commit**

---

### Task 5: EntityTabs — isAdmin + isMainOwner

**Files:**
- Modify: `equus/components/shared/entity-tabs.tsx`

**Interfaces:**
- Consumes: `isAdmin`, `isMainOwner` role flags from Task 3
- Produces: `EntityTab` interface gains `requireMainOwner?: boolean`
- Produces: EntityTabs gains `isMainOwner?: boolean` prop, `isOwner` renamed to `isAdmin`

- [ ] **Step 1: Add `requireMainOwner` to `EntityTab` interface**
- [ ] **Step 2: Rename `isOwner` prop to `isAdmin`, add `isMainOwner` optional prop**
- [ ] **Step 3: Update filter logic for dual role**
- [ ] **Step 4: Run build to verify**
- [ ] **Step 5: Commit**

---

### Task 6: HorsePageShell + Tab Definitions

**Files:**
- Modify: `equus/components/horses/horse-page-shell.tsx` — dual gating
- Modify: `equus/lib/navigation/horseTabs.ts` — `requireMainOwner` on admin tab

**Interfaces:**
- Consumes: EntityTabs from Task 5, role flags from Task 3
- Produces: Connect/Edit tabs available to `isAdmin`; Admin tab to `isMainOwner` only

- [ ] **Step 1: Add `requireMainOwner` prop to `HorsePageShellProps`**
- [ ] **Step 2: Update gating logic — `requireOwnership` checks `isAdmin`, `requireMainOwner` checks `isMainOwner`**
- [ ] **Step 3: Pass `isAdmin` and `isMainOwner` to EntityTabs**
- [ ] **Step 4: Add `requireMainOwner: true` to admin tab in `horseTabs.ts`**
- [ ] **Step 5: Run build to verify**
- [ ] **Step 6: Commit**

---

### Task 7: Admin Tab UI — Responsible Persons Section

**Files:**
- Create: `equus/components/horses/ownership/responsible-list.tsx`
- Create: `equus/components/horses/ownership/invite-responsible-form.tsx`
- Modify: `equus/components/horses/horse-admin-page-content.tsx` — add sections

**Interfaces:**
- Consumes: `useOwnershipTransfer` hooks, `OwnerHorseHubSummary` types from Task 3
- Produces: Responsible persons management UI

- [ ] **Step 1: Create `responsible-list.tsx` — display/responsible list with remove buttons**
- [ ] **Step 2: Create `invite-responsible-form.tsx` — email input + invite button**
- [ ] **Step 3: Add sections to `horse-admin-page-content.tsx` after ownership hub**
- [ ] **Step 4: Run build to verify**
- [ ] **Step 5: Commit**

---

### Task 8: Translations

**Files:**
- Modify: `equus/messages/en.json`
- Modify: `equus/messages/es.json`

- [ ] **Step 1: Add English translation keys for responsible persons**
- [ ] **Step 2: Add Spanish translation keys**
- [ ] **Step 3: Run build to verify**
- [ ] **Step 4: Commit**

---

### Task 9: Documentation Updates

**Files:**
- Modify: `equus/documentation/horseTabs.md` — update tab definitions with role info
- Modify: `documentation/horseModule.md` (if exists) — document new role
- Modify: `documentation/ownershipTransfer.md` — document new transfer kinds
- Modify: `equus/documentation/ownershipTransfer.md` — document new transfer kinds

- [ ] **Step 1: Update horseTabs.md with role-based visibility changes**
- [ ] **Step 2: Update ownershipTransfer docs with new transfer kinds**
- [ ] **Step 3: Commit**
