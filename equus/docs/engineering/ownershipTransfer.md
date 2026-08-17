# Ownership transfer API

**Job:** Consent changes to `mainOwnerUserId` / `coOwners[]` / `responsibles[]` on **entity-owned** profiles.  
**Upstream:** [`../features/ownershipTransfer.md`](../features/ownershipTransfer.md)  
**Status:** **aligned** (horse payer side effect removed on `transfer_main` accept; waiting-transfer greenfield)  
**Code roots:** `models/OwnershipTransfer.ts`, `lib/services/ownershipTransferService.ts`, `app/api/v1/ownership-transfers/`, `app/api/v1/users/me/ownership-transfers/`, `app/api/v1/horses/[id]/ownership-transfers/`

Not for user-linked service profiles (trainer, vet, groom, …).

---

## Shipped

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/v1/ownership-transfers` | Main owner initiates |
| `GET` | `/api/v1/users/me/ownership-transfers?status=pending` | Inbox |
| `PATCH` | `/api/v1/ownership-transfers/:id` | Accept / decline |
| `DELETE` | `/api/v1/ownership-transfers/:id` | Initiator cancel |
| `GET` | `/api/v1/horses/:id/ownership-transfers` | Outbound pending on horse hub |

Kinds: `transfer_main` (empty `coOwners[]`), `remove_co_owner`, `promote_co_owner`, `add_responsible`, `remove_responsible`. Duplicate pending → 409. Email: `sendOwnershipTransferInviteEmail`. UI: `/ownership-transfers`, horse Admin.

On horse `transfer_main` accept, **do not** assign or move `Horse.registration.payerUserId` — horses are free; entity subscription is Block 26. See [`billing.md`](billing.md).

---

## Target

Waiting-transfer (stable creates boarded horse → creating user temporary `mainOwner` + flag + daily nag) is **not** this collection’s `transfer_main` alone — implement the flag + nag per horse/stable specs. Stop assigning horse-level Equus payers. Stable owner hub entry points when stable SaaS ships.
