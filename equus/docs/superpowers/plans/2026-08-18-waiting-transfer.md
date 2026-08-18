# Waiting-transfer + 3-day nag — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship stable Path B horse create with embedded `waitingTransfer`, accepted stable relationship, `transfer_main` claim, 3-day nag (in-app + email + push stub), and home inbox rows.

**Architecture:** Extend `POST /api/v1/horses` and `Horse` model; orchestrate relationship + ownership transfer in `horseService.createHorse` (or dedicated `createWaitingTransferHorse` helper); nag via cron-triggered job; home consumes new `GET /users/me/waiting-transfer-horses`.

**Tech Stack:** Next.js App Router, Mongoose, Zod, Vitest, next-intl (en/es), existing email + notification services.

## Global Constraints

- Work from `equus/`.
- Spec: [`../specs/2026-08-18-waiting-transfer-design.md`](../specs/2026-08-18-waiting-transfer-design.md)
- Tests in colocated `__tests__/` per [`../../conventions/testing.md`](../../conventions/testing.md)
- UI → `/api/v1` only; logic in `lib/services/`
- Apply [`../../../../agents/senior-engineer.md`](../../../../agents/senior-engineer.md)
- i18n: en + es keys for new UI copy
- Do not build favorites, chat, stable roster UI (API must work for roster sub-plan later)

---

### Task 1: Horse model + enums

**Files:**
- Modify: `equus/models/Horse.ts`
- Modify: `equus/utils/enums.ts`
- Test: `equus/models/__tests__/horse.waitingTransfer.test.ts` (create)

**Interfaces:**
- Produces: `Horse` documents with optional `waitingTransfer` subdocument; `notificationTypeEnums` includes `"waiting_transfer"`

- [ ] **Step 1: Write the failing test**

```ts
import Horse from "@/models/Horse.ts";
import mongoose from "mongoose";

describe("Horse waitingTransfer schema", () => {
  it("persists waitingTransfer subdocument", async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const stableId = new mongoose.Types.ObjectId();
    const doc = await Horse.create({
      name: "Pending",
      breed: "Warmblood",
      sex: "Mare",
      mainOwnerUserId: ownerId,
      createdByUserId: ownerId,
      registration: { isActive: true },
      waitingTransfer: {
        active: true,
        invitedOwnerEmail: "owner@example.com",
        hostStableId: stableId,
        createdAt: new Date(),
      },
    });
    expect(doc.waitingTransfer?.invitedOwnerEmail).toBe("owner@example.com");
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npx vitest run models/__tests__/horse.waitingTransfer.test.ts -v`

- [ ] **Step 3: Add schema + enum**

In `Horse.ts`, add embedded schema (after ownership block):

```ts
const horseWaitingTransferSchema = new Schema(
  {
    active: { type: Boolean, required: true, default: true },
    invitedOwnerEmail: { type: String, required: true, lowercase: true, trim: true },
    hostStableId: { type: Schema.Types.ObjectId, ref: "Stable", required: true, index: true },
    createdAt: { type: Date, default: Date.now },
    nagLastSentAt: { type: Date },
  },
  { _id: false },
);
// on horseSchema: waitingTransfer: { type: horseWaitingTransferSchema, default: undefined }
horseSchema.index({ "waitingTransfer.active": 1, "waitingTransfer.nagLastSentAt": 1 });
```

In `enums.ts`, append `"waiting_transfer"` to `notificationTypeEnums`.

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add equus/models/Horse.ts equus/utils/enums.ts equus/models/__tests__/horse.waitingTransfer.test.ts
git commit -m "feat(horse): add waitingTransfer subdocument schema"
```

---

### Task 2: Validation + createHorse waiting-transfer path

**Files:**
- Modify: `equus/lib/validations/horse.ts`
- Modify: `equus/lib/services/horseService.ts`
- Modify: `equus/lib/services/relationshipService.ts` (add internal accepted-stable helper)
- Test: `equus/lib/services/__tests__/horseService.waitingTransfer.test.ts` (create)

**Interfaces:**
- Consumes: `userOwnsEntity`, `createOwnershipTransfer` from ownershipTransferService
- Produces: `createHorse(actorUserId, input)` handles optional `waitingTransfer` block

- [ ] **Step 1: Write failing service tests**

Cover: (1) stable main owner creates with waitingTransfer → horse flagged + relationship accepted + pending transfer_main; (2) create without block unchanged; (3) non-stable-owner forbidden; (4) self-email rejected.

Use existing test helpers (`authService.register`, `stableService.createStable`).

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npx vitest run lib/services/__tests__/horseService.waitingTransfer.test.ts -v`

- [ ] **Step 3: Implement**

Add to `createHorseSchema`:

```ts
waitingTransfer: z
  .object({
    invitedOwnerEmail: z.string().email(),
    hostStableId: z.string().min(1),
  })
  .optional(),
```

In `horseService.createHorse`, when `input.waitingTransfer` present:

1. Load stable; assert `userOwnsEntity(actorUserId, stable)`.
2. Normalize email; reject if equals actor email.
3. Set `doc.waitingTransfer = { active: true, invitedOwnerEmail, hostStableId, createdAt: new Date(), nagLastSentAt: new Date() }`.
4. After `Horse.create`, call `createAcceptedStableHostingRelationship({ horseId, stableId, actorUserId })`.
5. Call `createOwnershipTransfer` with `transferKind: "transfer_main"`, `entityType: "horse"`, `entityId`, `invitedEmail`.
6. Fire-and-forget initial email + notifications (Task 3).

Add `createAcceptedStableHostingRelationship` in relationshipService — creates `Relationship` with `status: "accepted"`, `relationshipType: "stable"`, horse owner as requester, stable as receiver. Skip duplicate if one already exists.

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit**

---

### Task 3: Email + notifications on create and nag

**Files:**
- Create: `equus/lib/email/sendWaitingTransferNagEmail.ts`
- Create: `equus/lib/email/templates/waitingTransferNag.ts`
- Create: `equus/lib/jobs/processWaitingTransferNags.ts`
- Create: `equus/app/api/v1/cron/waiting-transfer-nags/route.ts`
- Modify: `equus/lib/services/ownershipTransferService.ts` (on accept: `$unset waitingTransfer`)
- Test: `equus/lib/jobs/__tests__/processWaitingTransferNags.test.ts`

**Interfaces:**
- Produces: `processWaitingTransferNags()`; `sendWaitingTransferNagEmail({ locale, to, horseName, actionUrl, role })`

- [ ] **Step 1: Write failing nag job test**

Seed horse with `nagLastSentAt` 4 days ago; run job; assert notification created + `nagLastSentAt` updated; horse nagged within 3 days skipped.

- [ ] **Step 2: Implement job + email templates (en/es)**

Cron route checks `process.env.CRON_SECRET` header.

On `transfer_main` accept for horse with `waitingTransfer`: `$unset: { waitingTransfer: "" }` in same transaction as mainOwner update.

Notification `metadata: { pushPending: true }` for push stub.

- [ ] **Step 3: Run tests — expect PASS**

- [ ] **Step 4: Commit**

---

### Task 4: Waiting-transfer inbox API + home UI

**Files:**
- Create: `equus/app/api/v1/users/me/waiting-transfer-horses/route.ts`
- Create: `equus/lib/services/waitingTransferService.ts`
- Modify: `equus/components/home/home-action-inbox.tsx`
- Modify: `equus/hooks/queries/useAuthData.ts` (or new hook)
- Modify: `equus/messages/en.json`, `equus/messages/es.json`
- Test: `equus/app/api/v1/users/me/waiting-transfer-horses/__tests__/route.test.ts`

- [ ] **Step 1: Write failing route test**

Provisional owner sees horse; invited owner (after register with email) sees same horse with `role: "invited_owner"`.

- [ ] **Step 2: Implement service + route + home section**

Add third inbox section in `HomeActionInbox` — do not remove relationship/workplace sections.

Deep links: `/ownership-transfers`, `/horses/[id]/connect`.

- [ ] **Step 3: Run tests + manual `/home` check**

- [ ] **Step 4: Commit**

---

### Task 5: Docs alignment

**Files:**
- Modify: `equus/docs/engineering/horses.md`
- Modify: `equus/docs/engineering/myGraph.md`
- Modify: `equus/docs/engineering/ownershipTransfer.md`
- Modify: `equus/docs/features/myGraph.md` (MG-01 partial → done)

- [ ] **Step 1: Update Shipped/Target tables to match code**

- [ ] **Step 2: Commit**

```bash
git commit -m "docs: align waiting-transfer engineering specs"
```

---

### Task 6: Full verification

- [ ] Run `npm test` from `equus/`
- [ ] Run `npm run lint`
- [ ] Real flow: stable user creates waiting-transfer horse → invited email → signup → accept transfer → flag cleared

**Done when:** acceptance criteria in spec all checked.
