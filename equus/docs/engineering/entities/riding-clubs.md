# Riding clubs API (`/api/v1/riding-clubs`)

Reference for minimal riding club endpoints and discovery visibility behavior.

Related:
- [equus/docs/features/userModule.md](../../features/userModule.md)
- [`horses.md`](horses.md)
- [`stables.md`](stables.md)
- [equus/docs/engineering/profile.md](../profile.md)

---

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/v1/riding-clubs` | Create a riding club owned by the authenticated user (`mainOwnerUserId`) |
| `PATCH` | `/api/v1/riding-clubs/:id/discovery` | Update discovery settings (`isPublic`, `acceptsNewMembers`) for owner/co-owner |
| `GET` | `/api/v1/riding-clubs/:id` | **Unified role-aware riding-club view** — returns `{ viewerRole, allowedTabs, ridingClub }`. Auth optional; visibility still returns 404 when discovery denies access. |

A single User may create **multiple** riding clubs (unlike user-linked roles). Partnership uses the same `mainOwnerUserId` + `coOwners[]` embed as stables and transport companies.

---

## Discovery visibility model

```mermaid
flowchart TB
  requester[RequesterContext]
  clubRules[RidingClub.isPublic]
  entityContact[RidingClub business fields]
  viewEnvelope[Riding club view envelope]

  requester --> clubRules
  clubRules -->|"visible"| entityContact
  entityContact --> viewEnvelope
```

- `RidingClub.isPublic` (default `true`) controls anonymous discovery.
- When `isPublic: false`, visible only to owner/co-owner, active collaborators at the club, or users with an accepted horse ↔ riding club `Relationship`.
- Business contact (`clubName`, `email`, `phoneNumber`) lives on the **entity** — not filtered through `User.preferences`.

---

## Nested entity payload fields

`GET /api/v1/riding-clubs/:id` returns the view envelope `{ viewerRole, allowedTabs, ridingClub }`; clients use `getRidingClubView` / `useRidingClubView`. The nested `ridingClub` payload contains the following fields:

- `id`, `clubName`, `description`, `city`, `country` (from address)
- `disciplines`, `facilities`, `membershipInfo`, `membershipFee`, `acceptsNewMembers`, `isPublic`
- `contact: { email?, phone? }`

Returns **404** when discovery rules deny access (same pattern as horses and stables).

---

## Implementation

- Discovery rules: `lib/ridingClubs/ridingClubDiscoveryAccess.ts`
- View DTO: `toRidingClubView` / `getRidingClubView` in `lib/services/ridingClubService.ts`
- Service: `lib/services/ridingClubService.ts`
- Validation: `lib/validations/ridingClub.ts`

Collaboration APIs: `/api/v1/role-profiles/ridingClub/:id/workplace-relationships`.
