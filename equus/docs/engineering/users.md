# Users — hub and view APIs

**Job:** Public/owner user hub. Users are **not** a searchable module.  
**Upstream:** [`../features/userModule.md`](../features/userModule.md), [`../product/graph-and-identity.md`](../product/graph-and-identity.md)  
**Status:** **drift** (`GET /users/search` is a people directory)  
**Code roots:** `app/api/v1/users/`, `lib/privacy/userPublicProfile.ts`, `lib/users/userHubSections.ts`

Settings: [`profile.md`](profile.md). Tabs: [`userTabs.md`](userTabs.md). Favorites: [`favorites.md`](favorites.md).

---

## Shipped

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/v1/users/:id` | Public card; 404 if L1 blocks |
| `GET` | `/api/v1/users/:id/hub` | `{ sections }` L1+L2 |
| `GET` | `/api/v1/users/:id/view` | `{ user, isOwner }` — owner gets all sections |
| `GET` | `/api/v1/users/me/navigation` | Owned-entity flags |
| `GET` | `/api/v1/users/search?q=` | Search users by name/email — **used by horse Admin invite** |

Owner `GET`/`PATCH`/`DELETE /users/me`: [`profile.md`](profile.md).

L1: `preferences.profileVisibility` (`public` \| `platform` \| `relationships` \| `private`) on Preferences. L2 keys: `identity` \| `identification` \| `address` \| `contact` \| `entities` — Profile tab popovers, not Hub (PATCH: [`profile.md`](profile.md)). Enforce in `lib/privacy/userPublicProfile.ts` (`getUserHub`); owner view seeds `user.sections` via `getUserView`. `/user/[userId]` is self-only (`UserPageShell`). Public page: `/users/[userId]` (`useUserHub`). How to write the control: [`../conventions/visibility.md`](../conventions/visibility.md).

---

## Target

**No people search module.** Do not expose `/users/search` as discovery. Ownership invites: email / entity-linked identity, not a user directory. User pages are reached from **entities**. Never favorite Users.
