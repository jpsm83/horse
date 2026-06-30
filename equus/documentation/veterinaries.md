# Veterinaries API (`/api/v1/veterinaries`)

Reference for minimal veterinary endpoints and discovery visibility behavior.

Related:
- [`../../documentation/userAndRoles.md`](../../documentation/userAndRoles.md) — direct horse link vs barn collaborator paths
- [`../../documentation/workplaceRelationship.md`](../../documentation/workplaceRelationship.md) — vet at stable (operational) vs direct horse link
- [`horses.md`](./horses.md)
- [`profile.md`](./profile.md)

---

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/v1/veterinaries` | Create a veterinary profile linked to the authenticated user (`userId` + `User.veterinaryProfileId`) |
| `PATCH` | `/api/v1/veterinaries/:id/discovery` | Update discovery settings (`isPublic`, `acceptsNewPatients`) for profile owner |
| `GET` | `/api/v1/veterinaries/:id` | Return public veterinary card filtered by `isPublic` and requester context |

Veterinaries are **user-linked**: one profile per User. A second `POST` returns **409** when `veterinaryProfileId` is already set.

---

## Discovery visibility model

- `Veterinary.isPublic` (default `true`) controls anonymous discovery.
- When `isPublic: false`, visible only to the profile owner or users with an accepted horse ↔ veterinary `Relationship`.
- Business contact (`practiceName`, `email`, `phoneNumber`, `emergencyPhoneNumber`) lives on the **Veterinary** document — not filtered through `User.preferences`.

**Barn path:** a vet may collaborate at a stable via `WorkplaceRelationship` and treat hosted horses. That is **operational access**, not a discovery bypass for non-public veterinary listings.

**Direct path:** horse owners may link a vet via accepted horse ↔ veterinary `Relationship` without stable involvement (e.g. vet at owner's home).

---

## Public card fields

`GET /api/v1/veterinaries/:id` returns a `PublicVeterinaryCard`:

- `id`, `practiceName`, `description`, `city`, `country` (from address)
- `equineSpecializations`, `emergencyAvailability`, `serviceAreaKm`, `acceptsNewPatients`, `isPublic`
- `contact: { email?, phone?, emergencyPhone? }`

Returns **404** when discovery rules deny access (same pattern as coaches and trainers).

---

## Implementation

- Ownership helper: `lib/veterinaries/userLinkedProfileAccess.ts`
- Discovery rules: `lib/veterinaries/veterinaryDiscoveryAccess.ts`
- Public card mapper: `lib/veterinaries/buildPublicVeterinaryCard.ts`
- Service: `lib/services/veterinaryService.ts`
- Validation: `lib/validations/veterinary.ts`
