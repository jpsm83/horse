# Coaches API (`/api/v1/coaches`)

Reference for minimal coach endpoints and discovery visibility behavior.

Related:
- [`../../documentation/userModule.md`](../../documentation/userModule.md) — competition coach vs barn collaborator paths
- [`../../documentation/workplaceRelationship.md`](../../documentation/workplaceRelationship.md) — coach as stable collaborator (with trainer)
- [`horses.md`](./horses.md)
- [`profile.md`](./profile.md)

---

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/v1/coaches` | Create a coach profile linked to the authenticated user (`userId` + `User.coachProfileId`) |
| `PATCH` | `/api/v1/coaches/:id/discovery` | Update discovery settings (`isPublic`, `acceptsNewClients`) for profile owner |
| `GET` | `/api/v1/coaches/:id` | Return public coach card filtered by `isPublic` and requester context |

Coaches are **user-linked**: one profile per User. A second `POST` returns **409** when `coachProfileId` is already set.

---

## Discovery visibility model

- `Coach.isPublic` (default `true`) controls anonymous discovery.
- When `isPublic: false`, visible only to the profile owner or users with an accepted horse ↔ coach `Relationship`.
- Business contact (`displayName`, `email`, `phoneNumber`) lives on the **Coach** document — not filtered through `User.preferences`.

**Barn path:** a coach may collaborate at a stable via `WorkplaceRelationship` (same as trainer). That is **operational access**, not a discovery bypass for non-public coach listings.

Unlike entity-owned host profiles (stable, breeder), coaches do **not** use `WorkplaceRelationship` as a host role or `coOwners[]`.

---

## Public card fields

`GET /api/v1/coaches/:id` returns a `PublicCoachCard`:

- `id`, `displayName`, `bio`, `city`, `country` (from address)
- `disciplines`, `competitionLevels`, `preparationServices`, `experienceYears`, `acceptsNewClients`, `isPublic`
- `contact: { email?, phone? }`

Returns **404** when discovery rules deny access (same pattern as trainers and grooms).

---

## Implementation

- Ownership helper: `lib/coaches/userLinkedProfileAccess.ts`
- Discovery rules: `lib/coaches/coachDiscoveryAccess.ts`
- Public card mapper: `lib/coaches/buildPublicCoachCard.ts`
- Service: `lib/services/coachService.ts`
- Validation: `lib/validations/coach.ts`
