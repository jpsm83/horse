# Riders API (`/api/v1/riders`)

Reference for minimal rider endpoints and discovery visibility behavior.

Related:
- [`../../documentation/userModule.md`](../../documentation/userModule.md) — direct horse link vs barn collaborator paths
- [`../../documentation/workplaceRelationship.md`](../../documentation/workplaceRelationship.md) — rider as stable collaborator (horse groups, default team)
- [`horses.md`](./horses.md)
- [`profile.md`](./profile.md)

---

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/v1/riders` | Create a rider profile linked to the authenticated user (`userId` + `User.riderProfileId`) |
| `PATCH` | `/api/v1/riders/:id/discovery` | Update discovery settings (`isPublic`, `acceptsNewClients`) for profile owner |
| `GET` | `/api/v1/riders/:id` | Return public rider card filtered by `isPublic` and requester context |

Riders are **user-linked**: one profile per User. A second `POST` returns **409** when `riderProfileId` is already set.

---

## Discovery visibility model

- `Rider.isPublic` (default `true`) controls anonymous discovery.
- When `isPublic: false`, visible only to the profile owner or users with an accepted horse ↔ rider `Relationship`.
- Business contact (`displayName`, `email`, `phoneNumber`) lives on the **Rider** document — not filtered through `User.preferences`.

**Barn path:** a rider may collaborate at a stable via `WorkplaceRelationship` and work on hosted horses without a separate rider↔horse link. That is **operational access**, not a discovery bypass for non-public rider listings.

**Direct path:** horse owners may also link a rider via accepted horse ↔ rider `Relationship` without stable involvement.

---

## Public card fields

`GET /api/v1/riders/:id` returns a `PublicRiderCard`:

- `id`, `displayName`, `bio`, `city`, `country` (from address when set)
- `disciplines`, `experienceYears`, `competitionHighlights`, `acceptsNewClients`, `isPublic`
- `contact: { email?, phone? }`

Returns **404** when discovery rules deny access (same pattern as grooms and farriers).

---

## Implementation

- Ownership helper: `lib/riders/userLinkedProfileAccess.ts`
- Discovery rules: `lib/riders/riderDiscoveryAccess.ts`
- Public card mapper: `lib/riders/buildPublicRiderCard.ts`
- Service: `lib/services/riderService.ts`
- Validation: `lib/validations/rider.ts`
