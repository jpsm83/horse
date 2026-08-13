# Veterinaries API (`/api/v1/veterinaries`)

Reference for minimal veterinary endpoints and discovery visibility behavior.

Related:
- [equus/docs/features/userModule.md](../../features/userModule.md) — direct horse link vs barn collaborator paths
- [equus/docs/features/workplaceRelationship.md](../../features/workplaceRelationship.md) — vet at stable (operational) vs direct horse link
- [`horses.md`](horses.md)
- [equus/docs/engineering/profile.md](../profile.md)

---

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/v1/veterinaries` | Create a veterinary profile linked to the authenticated user (`userId` + `User.veterinaryProfileId`) |
| `PATCH` | `/api/v1/veterinaries/:id/discovery` | Update discovery settings (`isPublic`, `acceptsNewPatients`) for profile owner |
| `GET` | `/api/v1/veterinaries/:id` | **Unified role-aware veterinary view** — returns `{ viewerRole, allowedTabs, veterinary }`. Auth optional; visibility still returns 404 when discovery denies access. |

Veterinaries are **user-linked**: one profile per User. A second `POST` returns **409** when `veterinaryProfileId` is already set.

---

## Discovery visibility model

- `Veterinary.isPublic` (default `true`) controls anonymous discovery.
- When `isPublic: false`, visible only to the profile owner or users with an accepted horse ↔ veterinary `Relationship`.
- Business contact (`practiceName`, `email`, `phoneNumber`, `emergencyPhoneNumber`) lives on the **Veterinary** document — not filtered through `User.preferences`.

**Barn path:** a vet may collaborate at a stable via `WorkplaceRelationship` and treat hosted horses. That is **operational access**, not a discovery bypass for non-public veterinary listings.

**Direct path:** horse owners may link a vet via accepted horse ↔ veterinary `Relationship` without stable involvement (e.g. vet at owner's home).

---

## Nested entity payload fields

`GET /api/v1/veterinaries/:id` returns the view envelope `{ viewerRole, allowedTabs, veterinary }`; clients use `getVeterinaryView` / `useVeterinaryView`. The nested `veterinary` payload contains the following fields:

- `id`, `practiceName`, `description`, `email`, `phoneNumber`, `emergencyPhoneNumber`
- `address: { city?, country?, state?, street?, postCode?, buildingNumber? }`
- `equineSpecializations`, `emergencyAvailability`, `serviceAreaKm`, `acceptsNewPatients`, `isPublic`

Returns **404** when discovery rules deny access (same pattern as coaches and trainers).

---

## Implementation

- Ownership helper: `lib/veterinaries/userLinkedProfileAccess.ts`
- Discovery rules: `lib/veterinaries/veterinaryDiscoveryAccess.ts`
- View DTO: `toVeterinaryView` / `getVeterinaryView` in `lib/services/veterinaryService.ts`
- Service: `lib/services/veterinaryService.ts`
- Validation: `lib/validations/veterinary.ts`
