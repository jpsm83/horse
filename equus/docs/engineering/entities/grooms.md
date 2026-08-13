# Grooms API (`/api/v1/grooms`)

Reference for minimal groom endpoints and discovery visibility behavior.

Related:
- [equus/docs/features/userModule.md](../../features/userModule.md) — barn collaboration vs direct horse ↔ groom `Relationship`
- [equus/docs/features/workplaceRelationship.md](../../features/workplaceRelationship.md) — groom as stable collaborator
- [`horses.md`](horses.md)
- [equus/docs/engineering/profile.md](../profile.md)

---

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/v1/grooms` | Create a groom profile linked to the authenticated user (`userId` + `User.groomProfileId`) |
| `GET` | `/api/v1/grooms?mine=true` | List groom profiles owned by the authenticated user (one profile per user) |
| `PATCH` | `/api/v1/grooms/:id/discovery` | Update discovery settings (`isPublic`, `acceptsNewClients`) for profile owner |
| `GET` | `/api/v1/grooms/:id` | **Unified role-aware groom view** — returns `{ viewerRole, allowedTabs, groom }`. Auth optional; visibility still returns 404 when discovery denies access. |
| `PATCH` | `/api/v1/grooms/:id` | Update the groom profile for the owner (dirty-field `$set`/`$unset`; empty strings clear optional fields) |

Grooms are **user-linked**: one profile per User. A second `POST` returns **409** when `groomProfileId` is already set.

---

## Discovery visibility model

- `Groom.isPublic` (default `true`) controls anonymous discovery.
- When `isPublic: false`, visible only to the profile owner or users with an accepted horse ↔ groom `Relationship`.
- Business contact (`displayName`, `email`, `phoneNumber`) lives on the **Groom** document — not filtered through `User.preferences`.

**Barn path:** a groom may collaborate at a stable via `WorkplaceRelationship` and work on hosted horses without a separate groom↔horse link. That is **operational access**, not a discovery bypass for non-public groom listings.

---

## Nested entity payload fields

`GET /api/v1/grooms/:id` returns the view envelope `{ viewerRole, allowedTabs, groom }`; clients use `getGroomView` / `useGroomView`. The nested `groom` payload contains the following fields:

- `id`, `displayName`, `bio`, `email`, `phoneNumber`
- `address: { city?, country?, state?, street?, postCode?, buildingNumber? }`
- `specialties`, `experienceYears`, `acceptsNewClients`, `isPublic`

Returns **404** when discovery rules deny access (same pattern as trainers).

---

## Implementation

- Ownership helper: `lib/grooms/userLinkedProfileAccess.ts`
- Discovery rules: `lib/grooms/groomDiscoveryAccess.ts`
- View DTO: `toGroomView` / `getGroomView` in `lib/services/groomService.ts`
- Service: `lib/services/groomService.ts`
- Validation: `lib/validations/groom.ts`
