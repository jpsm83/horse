# Grooms API (`/api/v1/grooms`)

Reference for minimal groom endpoints and discovery visibility behavior.

Related:
- [`../../documentation/userAndRoles.md`](../../documentation/userAndRoles.md) — barn collaboration vs direct horse ↔ groom `Relationship`
- [`../../documentation/workplaceRelationship.md`](../../documentation/workplaceRelationship.md) — groom as stable collaborator
- [`horses.md`](./horses.md)
- [`profile.md`](./profile.md)

---

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/v1/grooms` | Create a groom profile linked to the authenticated user (`userId` + `User.groomProfileId`) |
| `PATCH` | `/api/v1/grooms/:id/discovery` | Update discovery settings (`isPublic`, `acceptsNewClients`) for profile owner |
| `GET` | `/api/v1/grooms/:id` | Return public groom card filtered by `isPublic` and requester context |

Grooms are **user-linked**: one profile per User. A second `POST` returns **409** when `groomProfileId` is already set.

---

## Discovery visibility model

- `Groom.isPublic` (default `true`) controls anonymous discovery.
- When `isPublic: false`, visible only to the profile owner or users with an accepted horse ↔ groom `Relationship`.
- Business contact (`displayName`, `email`, `phoneNumber`) lives on the **Groom** document — not filtered through `User.preferences`.

**Barn path:** a groom may collaborate at a stable via `WorkplaceRelationship` and work on hosted horses without a separate groom↔horse link. That is **operational access**, not a discovery bypass for non-public groom listings.

---

## Public card fields

`GET /api/v1/grooms/:id` returns a `PublicGroomCard`:

- `id`, `displayName`, `bio`, `city`, `country` (from address when set)
- `specialties`, `experienceYears`, `acceptsNewClients`, `isPublic`
- `contact: { email?, phone? }`

Returns **404** when discovery rules deny access (same pattern as trainers).

---

## Implementation

- Ownership helper: `lib/grooms/userLinkedProfileAccess.ts`
- Discovery rules: `lib/grooms/groomDiscoveryAccess.ts`
- Public card mapper: `lib/grooms/buildPublicGroomCard.ts`
- Service: `lib/services/groomService.ts`
- Validation: `lib/validations/groom.ts`
