# Breeders API (`/api/v1/breeders`)

Reference for minimal breeder endpoints and discovery visibility behavior.

Related:
- [`../../documentation/userModule.md`](../../documentation/userModule.md)
- [`horses.md`](./horses.md)
- [`stables.md`](./stables.md)
- [`profile.md`](./profile.md)

---

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/v1/breeders` | Create a breeding operation owned by the authenticated user (`mainOwnerUserId`) |
| `PATCH` | `/api/v1/breeders/:id/discovery` | Update discovery settings (`isPublic`) for owner/co-owner |
| `GET` | `/api/v1/breeders/:id` | Return public breeder card filtered by `isPublic` and requester context |

A single User may create **multiple** breeder entities (unlike user-linked roles).

---

## Discovery visibility model

- `Breeder.isPublic` (default `true`) controls anonymous discovery.
- When `isPublic: false`, visible only to owner/co-owner, active collaborators at the breeder, or users with an accepted horse ↔ breeder `Relationship`.
- Business contact (`operationName`, `email`, `phoneNumber`) lives on the **entity** — not filtered through `User.preferences`.

---

## Implementation

- Discovery rules: `lib/breeders/breederDiscoveryAccess.ts`
- Public card mapper: `lib/breeders/buildPublicBreederCard.ts`
- Service: `lib/services/breederService.ts`
- Validation: `lib/validations/breeder.ts`

Collaboration APIs: `/api/v1/role-profiles/breeder/:id/workplace-relationships`.
