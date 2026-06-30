# Trainers API (`/api/v1/trainers`)

Reference for minimal trainer endpoints and discovery visibility behavior.

Related:
- [`../../documentation/userAndRoles.md`](../../documentation/userAndRoles.md)
- [`horses.md`](./horses.md)
- [`profile.md`](./profile.md)

---

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/v1/trainers` | Create a trainer profile linked to the authenticated user (`userId` + `User.trainerProfileId`) |
| `PATCH` | `/api/v1/trainers/:id/discovery` | Update discovery settings (`isPublic`, `acceptsNewClients`) for profile owner |
| `GET` | `/api/v1/trainers/:id` | Return public trainer card filtered by `isPublic` and requester context |

Trainers are **user-linked**: one profile per User. A second `POST` returns **409** when `trainerProfileId` is already set.

---

## Discovery visibility model

- `Trainer.isPublic` (default `true`) controls anonymous discovery.
- When `isPublic: false`, visible only to the profile owner or users with an accepted horse ↔ trainer `Relationship`.
- Business contact (`displayName`, `email`, `phoneNumber`) lives on the **Trainer** document — not filtered through `User.preferences`.

Unlike entity-owned host profiles (stable, breeder), trainers do **not** use `WorkplaceRelationship` as a host role or `coOwners[]`.

---

## Public card fields

`GET /api/v1/trainers/:id` returns a `PublicTrainerCard`:

- `id`, `displayName`, `bio`, `city`, `country` (from address)
- `specialties`, `acceptsNewClients`, `isPublic`
- `contact: { email?, phone? }`

Returns **404** when discovery rules deny access (same pattern as horses and breeders).

---

## Implementation

- Ownership helper: `lib/trainers/userLinkedProfileAccess.ts`
- Discovery rules: `lib/trainers/trainerDiscoveryAccess.ts`
- Public card mapper: `lib/trainers/buildPublicTrainerCard.ts`
- Service: `lib/services/trainerService.ts`
- Validation: `lib/validations/trainer.ts`
