# Waiting-transfer + 3-day nag — Design

Date: 2026-08-18  
Status: approved for planning  
Related: [`../../features/horseModule.md`](../../features/horseModule.md) H-OWN-08, H-REL-01b, H-COM-05 · [`../../features/stableModule.md`](../../features/stableModule.md) S-HORSE-18 · [`../../engineering/horses.md`](../../engineering/horses.md) · [`../../engineering/ownershipTransfer.md`](../../engineering/ownershipTransfer.md) · [`../../features/myGraph.md`](../../features/myGraph.md)

## Problem

Path B hosting (stable creates a boarded horse before the real owner has an Equus account) is documented but not implemented. Home inbox, roster metering, and claim UX cannot ship without a horse-level waiting-transfer state.

## Goal

When a **stable operator** creates a horse on behalf of an owner (owner email required):

1. The stable’s **owning User** is temporary `mainOwnerUserId`.
2. Horse carries an embedded **`waitingTransfer`** subdocument until claim.
3. An **accepted** horse↔stable `Relationship` exists from creation.
4. Invited owner receives **`transfer_main`** (email + ownership inbox).
5. **Every 3 days**, stable user + invited owner get in-app notification + email (+ push stub).
6. `/home` shows waiting-transfer action rows for the provisional owner.
7. Normal horse create (owner or stable’s **own** horse) omits `waitingTransfer`.

## Non-goals

- Favorites, chat, stable ops modules, Portuguese locale.
- Auto-transfer without owner accept (consent model unchanged).
- Co-owners on waiting-transfer horses at create time.

---

## Data model

### Horse.waitingTransfer (embedded, optional)

```ts
type HorseWaitingTransfer = {
  active: true;
  invitedOwnerEmail: string;       // normalized lowercase
  hostStableId: ObjectId;          // Stable that created / hosts
  createdAt: Date;
  nagLastSentAt?: Date;            // throttle 3-day nag job
};
```

- **Absent or `active !== true`** → normal owned horse.
- **On successful claim** → remove `waitingTransfer` entirely; new user becomes `mainOwnerUserId`; stable remains host via existing `Relationship`.

Add compound index: `{ "waitingTransfer.active": 1, "waitingTransfer.nagLastSentAt": 1 }` for nag job queries.

### Distinguishing stable’s own horses

Same `POST /api/v1/horses`. Waiting-transfer fields are set **only** when the request includes `waitingTransfer: { invitedOwnerEmail, hostStableId }`. Omitting that block = current behavior (actor is real owner).

---

## API

### Extend `POST /api/v1/horses`

**New optional body fields** (Zod refinement on `createHorseSchema`):

```ts
waitingTransfer?: {
  invitedOwnerEmail: string;  // valid email, required if block present
  hostStableId: string;       // ObjectId; actor must be main owner of this stable
}
```

**Rules:**

| Check | Error |
|-------|-------|
| Actor is `mainOwnerUserId` (or co-owner with create permission — **main owner only** for v1) of `hostStableId` | 403 |
| Stable exists and is active | 404 |
| `invitedOwnerEmail` ≠ actor email | 400 |
| `invitedOwnerEmail` not already registered as actor | 400 |
| No `coOwners` on create | default empty ✓ |

**Side effects (single transaction where possible):**

1. Create horse with `mainOwnerUserId = actorUserId`, `waitingTransfer` populated, `createdByUserId = actorUserId`.
2. Create **accepted** `Relationship`: horse ↔ stable (`relationshipType: "stable"`, status `accepted`). Initiator = stable side per existing relationship patterns.
3. Create pending **`OwnershipTransfer`** `transfer_main` to `invitedOwnerEmail` (reuse `ownershipTransferService.createOwnershipTransfer`).
4. Send claim email (new template, localized en/es).
5. Create in-app notifications for stable user + invitee (if user exists).
6. Set `waitingTransfer.nagLastSentAt = now` (initial nag immediate on create for email; recurring job every 3 days).

**Response:** `{ horse }` 201 — include `waitingTransfer` in horse DTO when present.

### Extend `GET /api/v1/horses?mine=true`

Include horses where requester is `mainOwnerUserId` **and** `waitingTransfer.active` (provisional stable owner still “owns” for inbox/list purposes).

Optional list filter later: `waitingTransfer=true` — not required for v1 if mine already includes them.

### New `GET /api/v1/users/me/waiting-transfer-horses`

Returns horses where:

- `mainOwnerUserId = session user` AND `waitingTransfer.active`, **or**
- `personalDetails.email = waitingTransfer.invitedOwnerEmail` AND transfer pending (for invited owner after signup)

Used by home inbox; keeps home UI from scanning all horses client-side.

**Item shape:**

```ts
{
  horseId: string;
  horseName: string;
  hostStableId: string;
  hostStableName?: string;
  invitedOwnerEmail: string;
  role: "provisional_owner" | "invited_owner";
  ownershipTransferId?: string;
  createdAt: string;
}
```

### Claim flow (existing)

- Invited owner accepts **`transfer_main`** at `/ownership-transfers` (existing UI + API).
- On accept handler: clear `horse.waitingTransfer`; set `mainOwnerUserId` to receiver; **do not** end horse↔stable `Relationship`.
- Preconditions: `coOwners` empty (true for waiting-transfer creates).

---

## Notifications & email

### Notification type

Add `"waiting_transfer"` to `notificationTypeEnums`.

### Recipients (each 3-day cycle)

| User | Condition |
|------|-----------|
| Provisional owner (`mainOwnerUserId`) | `waitingTransfer.active` |
| Invited owner | Email match + pending `transfer_main`, or registered user linked to invite |

### Channels

| Channel | v1 |
|---------|-----|
| In-app | `createNotification` with `actionUrl` → horse Connect or ownership inbox |
| Email | New `sendWaitingTransferNagEmail` (en/es templates) |
| Push | Stub: set `metadata.pushPending: true` on notification; no web-push wiring |

### Nag scheduler

- New job: `lib/jobs/processWaitingTransferNags.ts`
- Query: `waitingTransfer.active === true` AND (`nagLastSentAt` absent OR `>= 3 days` ago)
- After send: update `nagLastSentAt`
- Invocation: API route `POST /api/v1/cron/waiting-transfer-nags` guarded by `CRON_SECRET` (same pattern as other cron stubs if any; otherwise document Vercel cron / manual trigger for dev)

**Cadence:** 3 days (not daily), per product decision.

---

## UI

### Stable create horse

- On stable module (when roster UI exists) or interim: extend horse create form when launched from stable context with **owner email** field + copy explaining waiting-transfer.
- v1 minimum: API + tests; stable roster UI may land in stable SaaS plan #4 — if no stable create UI yet, ship API + owner claim path + home rows; stable form can follow in roster sub-plan calling same API.

### Home (`/home`)

- Extend `HomeActionInbox` with **Waiting transfer** section from `GET /users/me/waiting-transfer-horses`.
- Row actions: provisional owner → link to horse Connect + “ownership pending”; invited owner → link to `/ownership-transfers`.

### Connect tab

- Show banner when `waitingTransfer.active` and viewer is provisional owner or invited owner.

---

## Billing / roster

Waiting-transfer horses **count toward stable roster meter** ([`../../engineering/billing.md`](../../engineering/billing.md)). Roster count helper (when built in stable plan) must include active `waitingTransfer` horses linked to that stable.

---

## Docs to update on ship

- [`../../engineering/horses.md`](../../engineering/horses.md) — Shipped rows + waiting-transfer
- [`../../engineering/myGraph.md`](../../engineering/myGraph.md) — waiting-transfer rows no longer omitted
- [`../../engineering/ownershipTransfer.md`](../../engineering/ownershipTransfer.md) — claim path documented as aligned
- [`../../features/myGraph.md`](../../features/myGraph.md) — MG-01 status

---

## Acceptance criteria

- [ ] Stable main owner POSTs horse with `waitingTransfer` + owner email → horse flagged, relationship accepted, transfer_main pending, emails/notifications sent
- [ ] Same user POSTs horse without `waitingTransfer` → normal owned horse
- [ ] Invited owner signs up, accepts transfer → becomes mainOwner, flag cleared, stable still host
- [ ] Nag job sends at most once per 3 days per horse to both parties
- [ ] `/home` lists waiting-transfer rows for provisional owner and invited owner
- [ ] `npm test` passes; engineering docs aligned
