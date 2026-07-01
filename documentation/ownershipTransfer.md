# Entity ownership transfer — product specification

Consent-based changes to **entity-owned** profiles only. Spec lives in the **user module** (who may own horses and host businesses); horse and stable modules consume the same rules on their entities.

**Not in scope:** user-linked **service** profiles (trainer, veterinary, groom, farrier, coach, rider). Those are tied to one `User` via `userId` / `*ProfileId` — they are not sold or transferred as entities.

Related:
- [`userModule.md`](userModule.md) §4 — ownership model and feature IDs
- [`productFlows.md`](productFlows.md) — Flows 10–12
- [`businessPlan.md`](businessPlan.md) §Phase 7
- [`equus/documentation/ownershipTransfer.md`](../equus/documentation/ownershipTransfer.md) — planned REST API
- [`workplaceRelationship.md`](workplaceRelationship.md) — operational staff (distinct from ownership)

---

## Principles

1. **Ownership never changes until the receiving user accepts** — same consent model as `Relationship` and `WorkplaceRelationship`.
2. **Pending state lives in `OwnershipTransfer` documents** — not on the entity. The entity keeps current `mainOwnerUserId` and `coOwners[]` until an accepted transfer applies.
3. **Offline first** — parties agree in person or chat, then the main owner sends the formal invite on Equus.
4. **Eligible entities:** `Horse`, `Stable`, `Breeder`, `Transport`, `RidingClub` only.
5. **No hard deletes** — entities and transfer documents are tombstoned or status-driven; see [`dataLifecycle.md`](dataLifecycle.md).

---

## Entity ownership shape (unchanged at rest)

| Field | Meaning |
|-------|---------|
| `mainOwnerUserId` | Single operator with full owner capabilities |
| `coOwners[]` | Accepted partners (`userId`, `ownershipPercentage`, `isBillingResponsible`) |
| `createdByUserId` | Audit only — never changed by transfer |

Helpers: [`equus/lib/ownership/entityOwnership.ts`](../equus/lib/ownership/entityOwnership.ts).

---

## `OwnershipTransfer` transfer kinds

One collection models all ownership **lifecycle** events (like `Relationship` for horse ↔ provider).

| Kind | Initiator | Receiver must accept | Effect on accept |
|------|-----------|----------------------|------------------|
| **`transfer_main`** | Current `mainOwnerUserId` | New main owner (User or email invite) | `mainOwnerUserId` → receiver; `coOwners[]` must already be **empty**; former main **loses** owner access |
| **`remove_co_owner`** | `mainOwnerUserId` | Co-owner being removed | Remove that user from `coOwners[]`; co-owner **loses** owner access |
| **`promote_co_owner`** | `mainOwnerUserId` | Co-owner being promoted | Promoted user → `mainOwnerUserId`; remove them from `coOwners[]`; **other co-owners stay**; former main **loses** owner access |

### Rules by kind

#### `transfer_main` (sale / handoff to another user)

- **Precondition:** `coOwners[]` is **empty**. If any co-owners exist, the main owner must complete **`remove_co_owner`** flows (each accepted) before sending `transfer_main`.
- **On accept:** New user becomes `mainOwnerUserId`. Horse subscription / billing responsibility moves to the new main owner per horse billing rules.
- **On decline / cancel:** Entity unchanged.

#### `remove_co_owner`

- Main owner initiates removal of one co-owner; **that co-owner** accepts or declines.
- Until accepted, the co-owner **retains** current owner access (discuss-and-agree offline, then formalize).
- On accept: entry removed from `coOwners[]` only; `mainOwnerUserId` unchanged.

#### `promote_co_owner`

- Main owner offers main ownership to an **existing** co-owner.
- **No requirement** to remove other co-owners first.
- On accept: promoted user → `mainOwnerUserId`; promoted user removed from `coOwners[]`; remaining `coOwners[]` entries unchanged; former main owner **loses** all owner access (not left as co-owner unless a separate add flow exists later).

---

## What does not change on transfer

- Horse health records, timeline, documents, and `Relationship` history remain on the entity.
- Active `Relationship` and `WorkplaceRelationship` links are **not** deleted; permissions are re-evaluated under the new owner context (horse module / stable module detail).
- `createdByUserId` and historical `OwnershipTransfer` rows are retained for audit.

---

## User inbox

Receivers act at a dedicated inbox (**`/ownership-transfers`**) alongside `/relationships` and `/workplaces`.

Email + signup bridge for unregistered recipients (same `referralReference` pattern as relationship invites) — optional v2 if all parties must be registered for MVP.

---

## Feature IDs (user module)

| ID | Feature | Status |
|----|---------|--------|
| U-ROLE-03 | `coOwners[]` embed on entity-owned models | done (schema) |
| U-ROLE-06 | `OwnershipTransfer` model + consent flows (`transfer_main`, `remove_co_owner`, `promote_co_owner`) | done |
| U-ROLE-07 | Ownership transfer inbox UI (`/ownership-transfers`) | done |

Adding a new co-owner (partnership invite) may be a future **`add_co_owner`** kind or separate U-ROLE scope — not required for the three flows above.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-30 | Locked consent-based OwnershipTransfer; three kinds; co-owner preconditions for external transfer |
