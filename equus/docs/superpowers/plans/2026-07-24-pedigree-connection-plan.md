# Pedigree Connection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace plain-text sire/dam inputs in the Profile > Pedigree section with a consent-based horse connection system using `OwnershipTransfer`.

**Architecture:** Extends `OwnershipTransfer` with two new transfer kinds (`connect_sire`, `connect_dam`) for the consent flow. New reusable `HorseInviteSection` component in `components/shared/` for horse search+invite. New `GET /api/v1/horses/search` endpoint.

**Tech Stack:** Next.js 16, Mongoose, TanStack Query, React Hook Form, Zod

## Global Constraints

- No hard deletes — use deactivationAuditFields pattern
- Business logic stays in `lib/`, not in route handlers or components
- Client-side forms use React Hook Form + Zod; mutation actions use TanStack Query
- i18n via `next-intl` — no hardcoded user-facing strings

---

### Task 1: Data Model — Pedigree Schema & OwnershipTransfer

**Files:**
- Modify: `models/sharedSchemas/pedigree.ts`
- Modify: `utils/enums.ts`
- Modify: `models/OwnershipTransfer.ts`

**Interfaces:**
- Produces: Updated `pedigreeSchema` with `sireHorseId`/`damHorseId`, no `sireId`/`damId`
- Produces: `ownershipTransferKindEnums` includes `"connect_sire"`, `"connect_dam"`
- Produces: OwnershipTransfer schema with `pedigreeRole`, `connectedHorseId`, `connectedHorseName`

- [ ] **Step 1: Update `pedigree.ts`** — Add `sireHorseId` and `damHorseId` as `Schema.Types.ObjectId, ref: "Horse"`. Remove `sireId` and `damId` fields. Keep `sireName` and `damName`.

- [ ] **Step 2: Update `enums.ts`** — Add `"connect_sire"` and `"connect_dam"` to `ownershipTransferKindEnums` array.

- [ ] **Step 3: Update `OwnershipTransfer.ts`** — Add three new optional fields:
  ```ts
  pedigreeRole: { type: String, enum: ["sire", "dam"] },
  connectedHorseId: { type: Schema.Types.ObjectId, ref: "Horse" },
  connectedHorseName: { type: String },
  ```

- [ ] **Step 4: Commit** — `git commit -m "feat: add pedigree ref fields and connect_sire/connect_dam transfer kinds"`

---

### Task 2: Validation Updates

**Files:**
- Modify: `lib/validations/horse.ts` (server API Zod)
- Modify: `lib/validations/horseForms.ts` (client form Zod)
- Modify: `lib/validations/ownershipTransfer.ts`

- [ ] **Step 1: Update `horse.ts`** — Remove `sireId` and `damId` from `horsePedigreeSchema`. Add optional `sireHorseId` and `damHorseId` (string type).

- [ ] **Step 2: Update `horseForms.ts`** — Remove `sireId` and `damId` from both `pedigreeFormSchema` functions.

- [ ] **Step 3: Update `ownershipTransfer.ts`** — Add `"connect_sire"` and `"connect_dam"` to allowed `transferKind` values. Add validation for `pedigreeRole`, `connectedHorseId`, `connectedHorseName`.

- [ ] **Step 4: Commit** — `git commit -m "feat: update validations for pedigree connection model changes"`

---

### Task 3: Service Layer — OwnershipTransfer Connect Sire/Dam

**Files:**
- Modify: `lib/services/ownershipTransferService.ts`

**Interfaces:**
- Consumes: Updated `OwnershipTransfer` model from Task 1
- Produces: `createOwnershipTransfer` accepts new transfer kinds with guard preconditions
- Produces: `applyEntityOwnershipChange` handles `connect_sire`/`connect_dam`

- [ ] **Step 1: Add guard function** — validate preconditions at create time: requesting horse active, role valid, no self-reference, no duplicate role.

- [ ] **Step 2: Add cases in `applyEntityOwnershipChange`** — handle existing horse (set ref + name) and invite (create horse + set ref + name).

- [ ] **Step 3: Write/update tests** for the new transfer kinds.

- [ ] **Step 4: Run tests** — `npm test` — verify pass

- [ ] **Step 5: Commit** — `git commit -m "feat: add connect_sire/connect_dam handling in OwnershipTransfer service"`

---

### Task 4: Horse Search API + Hook

**Files:**
- Create: `app/api/v1/horses/search/route.ts`
- Modify: `lib/api/queryKeys.ts`
- Create: `hooks/queries/useHorseSearch.ts`

- [ ] **Step 1: Add query key** in `queryKeys.ts`

- [ ] **Step 2: Create route handler** — `GET /api/v1/horses/search?q=...` searching by name, registeredName, registryId, microchipId, passportNumber, owner email.

- [ ] **Step 3: Create `useHorseSearch` hook** — TanStack Query hook calling the search endpoint.

- [ ] **Step 4: Commit** — `git commit -m "feat: add horse search API endpoint and useHorseSearch hook"`

---

### Task 5: HorseInviteSection Component

**Files:**
- Create: `components/shared/horse-invite-section.tsx`

- [ ] **Step 1: Create the component** — Search with debounce, results list, email fallback, connected state.

- [ ] **Step 2: Commit** — `git commit -m "feat: add HorseInviteSection reusable component"`

---

### Task 6: OwnershipTransfer Inbox + PedigreeSection + Profile Updates

**Files:**
- Modify: `components/invites/ownership-transfers-content.tsx`
- Modify: `components/horses/profile/pedigree-section.tsx`
- Modify: `app/[locale]/horses/[horseId]/profile/client.tsx`
- Modify: `lib/utils/horseProfilePatch.ts`

- [ ] **Step 1: Update inbox UI** — Display labels for `connect_sire`/`connect_dam`.

- [ ] **Step 2: Update `horseProfilePatch.ts`** — Remove `sireId`/`damId` from patches and defaults.

- [ ] **Step 3: Rewrite `pedigree-section.tsx`** — Two HorseInviteSection instances, connect/disconnect mutations, bloodlineNotes textarea.

- [ ] **Step 4: Update `profile/client.tsx`** — New props for PedigreeSection.

- [ ] **Step 5: Commit** — `git commit -m "feat: rewrite PedigreeSection with horse connection + consent flow"`

---

### Task 7: i18n Updates

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/es.json`

- [ ] **Step 1: Update `en.json`** — Remove old sireId/damId keys. Add new pedigree connection labels.

- [ ] **Step 2: Update `es.json`** — Same changes.

- [ ] **Step 3: Commit** — `git commit -m "feat: update i18n for pedigree connection system"`
