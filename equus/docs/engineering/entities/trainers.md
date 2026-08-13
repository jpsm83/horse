# Trainers API (`/api/v1/trainers`)

Reference for minimal trainer endpoints and discovery visibility behavior.

Related:
- [equus/docs/features/userModule.md](../../features/userModule.md)
- [`horses.md`](horses.md)
- [equus/docs/engineering/profile.md](../profile.md)

---

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/v1/trainers` | Create a trainer profile linked to the authenticated user (`userId` + `User.trainerProfileId`) |
| `PATCH` | `/api/v1/trainers/:id/discovery` | Update discovery settings (`isPublic`, `acceptsNewClients`) for profile owner |
| `GET` | `/api/v1/trainers/:id` | **Unified role-aware trainer view** — returns `{ viewerRole, allowedTabs, trainer }`. Auth optional; visibility still returns 404 when discovery denies access. |

Trainers are **user-linked**: one profile per User. A second `POST` returns **409** when `trainerProfileId` is already set.

---

## Discovery visibility model

- `Trainer.isPublic` (default `true`) controls anonymous discovery.
- When `isPublic: false`, visible only to the profile owner or users with an accepted horse ↔ trainer `Relationship`.
- Business contact (`displayName`, `email`, `phoneNumber`) lives on the **Trainer** document — not filtered through `User.preferences`.

Unlike entity-owned host profiles (stable, breeder), trainers do **not** use `WorkplaceRelationship` as a host role or `coOwners[]`.

---

## Nested entity payload fields

`GET /api/v1/trainers/:id` returns the view envelope `{ viewerRole, allowedTabs, trainer }`; clients use `getTrainerView` / `useTrainerView`. The nested `trainer` payload contains the following fields:

- `id`, `displayName`, `bio`, `city`, `country` (from address)
- `specialties`, `acceptsNewClients`, `isPublic`
- `contact: { email?, phone? }`

Returns **404** when discovery rules deny access (same pattern as horses and breeders).

---

## Implementation

- Ownership helper: `lib/trainers/userLinkedProfileAccess.ts`
- Discovery rules: `lib/trainers/trainerDiscoveryAccess.ts`
- View DTO: `toTrainerView` / `getTrainerView` in `lib/services/trainerService.ts`
- Service: `lib/services/trainerService.ts`
- Validation: `lib/validations/trainer.ts`
