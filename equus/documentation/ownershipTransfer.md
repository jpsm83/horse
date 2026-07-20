# Ownership transfer API

Consent-based changes to `mainOwnerUserId` and `coOwners[]` on **entity-owned** profiles (`Horse`, `Stable`, `Breeder`, `Transport`, `RidingClub`). Product rules: [`../../documentation/ownershipTransfer.md`](../../documentation/ownershipTransfer.md).

**Not applicable** to user-linked service profiles (trainer, veterinary, groom, farrier, coach, rider).

---

## Model

Collection: **`OwnershipTransfer`** (`models/OwnershipTransfer.ts`) — lifecycle document (not embedded pending arrays on entities).

| Field | Purpose |
|-------|---------|
| `entityType` | `horse` \| `stable` \| `breeder` \| `transport` \| `ridingClub` |
| `entityId` | Target entity ObjectId |
| `transferKind` | `transfer_main` \| `remove_co_owner` \| `promote_co_owner` \| `add_responsible` \| `remove_responsible` |
| `status` | `pending` \| `accepted` \| `declined` \| `cancelled` |
| `initiatorUserId` | Usually current `mainOwnerUserId` |
| `receiverUserId` | Set when receiver is registered |
| `targetCoOwnerUserId` | For `remove_co_owner` / `promote_co_owner` |
| `invitedEmail` / `invitedName` / `referralReference` | Optional pre-signup path |
| `requestedAt` / `respondedAt` | Lifecycle |
| `historicalReference` | Snapshots (`entityName`, labels) for audit |

**Apply on accept (service layer, single transaction):**

- `transfer_main` — require `coOwners.length === 0` at create **and** accept; set `mainOwnerUserId`; former main loses `userOwnsEntity` access; `createdByUserId` unchanged (UA-15)
- `remove_co_owner` — `$pull` matching `coOwners.userId`; main owner unchanged; target co-owner must accept (UA-16)
- `promote_co_owner` — set `mainOwnerUserId` to promoted user; `$pull` promoted from `coOwners`; leave other co-owners; former main loses access (UA-17)
- `add_responsible` — `$push` to `responsibles[]` for the receiver user id; initiator must be main owner (UA-19)
- `remove_responsible` — `$pull` from `responsibles[]` for the `targetCoOwnerUserId`; initiator must be main owner; target must accept (UA-19)

Reject duplicate pending transfers of the same kind for the same entity + receiver (409).

---

## Endpoints (shipped — UA-18)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/api/v1/ownership-transfers` | Yes | Main owner initiates (`transferKind`, `entityType`, `entityId`, receiver or `targetCoOwnerUserId`) |
| `GET` | `/api/v1/users/me/ownership-transfers?status=pending` | Yes | Inbox — pending transfers received by the user (or matched by `invitedEmail`) |
| `PATCH` | `/api/v1/ownership-transfers/:id` | Yes | Receiver accepts or declines (`{ "status": "accepted" \| "declined" }`) |
| `DELETE` | `/api/v1/ownership-transfers/:id` | Yes | Initiator cancels pending |

Validation: `lib/validations/ownershipTransfer.ts`.  
Business logic: `lib/services/ownershipTransferService.ts`.

**Billing (UA-21 / H-BILL-03):** On horse `transfer_main` accept, `lib/horses/horseSubscriptionBilling.ts` sets `Horse.subscription.payerUserId` to the new `mainOwnerUserId`. Subscription status and referral fields stay on the horse until payment-provider integration (H-BILL-05).

---

## Preconditions (enforced in service)

| Kind | Check before create |
|------|---------------------|
| `transfer_main` | Initiator is `mainOwnerUserId`; `coOwners[]` empty; no other pending `transfer_main` for entity |
| `remove_co_owner` | Initiator is main owner; target is in `coOwners[]` |
| `promote_co_owner` | Initiator is main owner; target is in `coOwners[]` |

---

## Web UI (shipped — UA-19, UA-20)

- Inbox: `/ownership-transfers` (locale-prefixed) — accept/decline pending transfers received by the signed-in user
- Horse hub (`/horses/[id]`): main owner can **transfer ownership** (email invite when no co-owners) or **manage co-owners** (remove / promote); pending outbound requests can be cancelled
- Stable hub entry points — planned when stable owner hub ships
- i18n namespaces: `invites.ownershipTransfers`, `horseHub.ownership`

---

## Tests

`tests/lib/services/ownershipTransferService.test.ts` — create preconditions, accept/decline/cancel, duplicate pending, and UA-22 integration flows (syndicate wind-down → `transfer_main`; `promote_co_owner` with remaining co-owners).

`tests/lib/services/ownershipTransferService.transferMain.test.ts` — UA-15 `transfer_main` (co-owner guard, accept handoff, email invite, stable entity).

`tests/lib/services/ownershipTransferService.removeCoOwner.test.ts` — UA-16 `remove_co_owner` (main initiates, target accepts, pending access, decline/cancel).

`tests/lib/services/ownershipTransferService.promoteCoOwner.test.ts` — UA-17 `promote_co_owner` (swap main, keep other co-owners, former main loses access).

`tests/app/api/v1/ownership-transfers/route.test.ts` — UA-18 REST contract (create, inbox, accept, decline, cancel, auth).

`tests/lib/api/authClient.ownershipTransfers.test.ts` — UA-19 web client fetch/accept/decline helpers.

`tests/app/api/v1/horses/[id]/ownership-transfers/route.get.test.ts` — UA-20 horse hub outbound pending list.

`tests/lib/horses/horseSubscriptionBilling.test.ts` — UA-21 payer assignment on create and `transfer_main` accept.

---

## Related modules

- Horse billing after `transfer_main`: [`../../documentation/horseModule.md`](../../documentation/horseModule.md) H-BILL-03
- Stable operator context: [`../../documentation/stableModule.md`](../../documentation/stableModule.md)
