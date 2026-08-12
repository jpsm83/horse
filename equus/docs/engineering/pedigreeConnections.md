# Pedigree connections

Consent flow for linking a child horse’s **sire** or **dam**. Acknowledgment only — never changes ownership on either horse.

## Model

Collection: `PedigreeConnection` (`models/PedigreeConnection.ts`).

| Field | Purpose |
|-------|---------|
| `childHorseId` | Offspring horse (requester’s horse) |
| `role` | `sire` \| `dam` |
| `status` | `pending` \| `accepted` \| `declined` \| `cancelled` |
| `initiatorUserId` | Main owner of the child |
| `receiverUserId` / `invitedEmail` / `referralReference` | Parent owner (registered or invite) |
| `parentHorseId` | Existing Equus parent (search path) |
| `parentHorseName` | Invite path (parent stub created on accept; identity IDs filled later on profile) |

On **accept**:

- With `parentHorseId`: verify accepter is parent’s main owner; set `Horse.pedigree.sire*|dam*` on the child.
- Without: create a parent horse stub owned by the accepter (name only; IDs optional), then link.

Email invite form fields: **parent horse name + owner email** only.

On **create**: sends pedigree invite email (`lib/email/sendPedigreeConnectInviteEmail.ts`). Email failure rolls back the pending document.

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/v1/pedigree-connections` | Initiate (main owner of child) |
| `GET` | `/api/v1/users/me/pedigree-connections?status=pending` | Inbox |
| `PATCH` | `/api/v1/pedigree-connections/:id` | Accept / decline |
| `DELETE` | `/api/v1/pedigree-connections/:id` | Initiator cancel |

## UI

- Profile Pedigree tab: search by registry / microchip / passport; invite fallback with name + email + ≥1 ID
- Inbox: `/pedigree-connections`

## Related

- Horse identity uniqueness: `lib/utils/horseIdentity.ts`
- Ownership transfers are a **separate** feature (`equus/docs/features/ownershipTransfer.md`)
