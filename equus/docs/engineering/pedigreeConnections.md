# Pedigree connections

**Job:** Consent to link a child’s sire/dam. Never changes ownership.  
**Upstream:** [`../features/horseModule.md`](../features/horseModule.md) (identity/pedigree)  
**Status:** **aligned**  
**Code roots:** `models/PedigreeConnection.ts`, `lib/services/pedigreeConnectionService.ts`, `app/api/v1/pedigree-connections/`

Ownership: [`ownershipTransfer.md`](ownershipTransfer.md).

---

## Shipped

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/v1/pedigree-connections` | Child main owner initiates |
| `GET` | `/api/v1/users/me/pedigree-connections?status=pending` | Inbox |
| `PATCH` | `/api/v1/pedigree-connections/:id` | Accept / decline |
| `DELETE` | `/api/v1/pedigree-connections/:id` | Initiator cancel |

Accept with `parentHorseId`: accepter must be that horse’s main owner; set child `pedigree.sire*|dam*`. Without: create parent stub owned by accepter. Email failure rolls back pending doc (`sendPedigreeConnectInviteEmail`).

UI: horse Profile pedigree + `/pedigree-connections`. Identity uniqueness: `lib/utils/horseIdentity.ts`.
