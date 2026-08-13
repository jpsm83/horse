# Breeders API (`/api/v1/breeders`)

Reference for minimal breeder endpoints and discovery visibility behavior.

Related:
- [equus/docs/features/userModule.md](../../features/userModule.md)
- [`horses.md`](horses.md)
- [`stables.md`](stables.md)
- [equus/docs/engineering/profile.md](../profile.md)

---

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/v1/breeders` | Create a breeding operation owned by the authenticated user (`mainOwnerUserId`) |
| `PATCH` | `/api/v1/breeders/:id/discovery` | Update discovery settings (`isPublic`) for owner/co-owner |
| `GET` | `/api/v1/breeders/:id` | **Unified role-aware breeder view** — returns `{ viewerRole, allowedTabs, breeder }`. Auth optional; visibility still returns 404 when discovery denies access. |

A single User may create **multiple** breeder entities (unlike user-linked roles).

---

## Discovery visibility model

- `Breeder.isPublic` (default `true`) controls anonymous discovery.
- When `isPublic: false`, visible only to owner/co-owner, active collaborators at the breeder, or users with an accepted horse ↔ breeder `Relationship`.
- Business contact (`operationName`, `email`, `phoneNumber`) lives on the **entity** — not filtered through `User.preferences`.

---

`GET /api/v1/breeders/:id` returns the view envelope `{ viewerRole, allowedTabs, breeder }`; clients use `getBreederView` / `useBreederView`. The nested `breeder` payload contains the following fields.

- `id`, `operationName`, `description`, `email`, `phoneNumber`
- `address: { city?, country?, state?, street?, postCode?, buildingNumber? }`
- `disciplines`, `bloodlines`, `isPublic`

---

## Implementation

- Discovery rules: `lib/breeders/breederDiscoveryAccess.ts`
- View DTO: `toBreederView` / `getBreederView` in `lib/services/breederService.ts`
- Service: `lib/services/breederService.ts`
- Validation: `lib/validations/breeder.ts`

Collaboration APIs: `/api/v1/role-profiles/breeder/:id/workplace-relationships`.
