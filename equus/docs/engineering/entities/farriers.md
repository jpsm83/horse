# Farriers API (`/api/v1/farriers`)

Reference for minimal farrier endpoints and discovery visibility behavior.

Related:
- [equus/docs/features/userModule.md](../../features/userModule.md) — direct horse link vs barn collaborator paths
- [equus/docs/features/workplaceRelationship.md](../../features/workplaceRelationship.md) — farrier as stable collaborator
- [`horses.md`](horses.md)
- [equus/docs/engineering/profile.md](../profile.md)

---

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/v1/farriers` | Create a farrier profile linked to the authenticated user (`userId` + `User.farrierProfileId`) |
| `GET` | `/api/v1/farriers?mine=true` | List farrier profiles owned by the authenticated user (one profile per user) |
| `PATCH` | `/api/v1/farriers/:id/discovery` | Update discovery settings (`isPublic`, `acceptsNewClients`) for profile owner |
| `GET` | `/api/v1/farriers/:id` | **Unified role-aware farrier view** — returns `{ viewerRole, allowedTabs, farrier }`. Auth optional; visibility still returns 404 when discovery denies access. |
| `PATCH` | `/api/v1/farriers/:id` | Update the farrier profile for the owner (dirty-field `$set`/`$unset`; empty strings clear optional fields) |

Farriers are **user-linked**: one profile per User. A second `POST` returns **409** when `farrierProfileId` is already set.

---

## Discovery visibility model

- `Farrier.isPublic` (default `true`) controls anonymous discovery.
- When `isPublic: false`, visible only to the profile owner or users with an accepted horse ↔ farrier `Relationship`.
- Business contact (`displayName`, `email`, `phoneNumber`) lives on the **Farrier** document — not filtered through `User.preferences`.

**Barn path:** a farrier may collaborate at a stable via `WorkplaceRelationship` and work on hosted horses without a separate farrier↔horse link. That is **operational access**, not a discovery bypass for non-public farrier listings.

**Direct path:** horse owners may also link a farrier via accepted horse ↔ farrier `Relationship` without stable involvement.

---

## Nested entity payload fields

`GET /api/v1/farriers/:id` returns the view envelope `{ viewerRole, allowedTabs, farrier }`; clients use `getFarrierView` / `useFarrierView`. The nested `farrier` payload contains the `PublicFarrierCard` fields:

- `id`, `displayName`, `bio`, `city`, `country` (from address when set)
- `experienceYears`, `serviceAreaKm`, `acceptsNewClients`, `isPublic`
- `contact: { email?, phone? }`

Returns **404** when discovery rules deny access (same pattern as grooms and trainers).

---

## Implementation

- Ownership helper: `lib/farriers/userLinkedProfileAccess.ts`
- Discovery rules: `lib/farriers/farrierDiscoveryAccess.ts`
- Public card mapper: `lib/farriers/buildPublicFarrierCard.ts`
- Service: `lib/services/farrierService.ts`
- Validation: `lib/validations/farrier.ts`
