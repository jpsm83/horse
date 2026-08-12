# Users — Hub API + visibility (`/api/v1/users`)

Reference for the user hub and its visibility model. Mirrors `equus/docs/engineering/entities/horses.md` for the user entity.

Related:
- [`userTabs.md`](userTabs.md) — `/user/[userId]` tab map
- [`profile.md`](profile.md) — profile/preferences edit UI and `PATCH /api/v1/users/me`
- [`page-flow-blueprint.md`](page-flow-blueprint.md) — shared page/layout/error-boundary patterns
- [equus/docs/features/userModule.md](../features/userModule.md) — user module spec (U-PRIV-05)

---

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/v1/users/:id` | Public user profile **card** — audience-filtered by `profileVisibility`; 404 when blocked |
| `GET` | `/api/v1/users/:id/hub` | **User hub sections** — `{ sections: { identity?, about?, contact?, entities? } }`, audience-filtered by L1 + L2 |
| `GET/PATCH` | `/api/v1/users/me` | Owner profile (JSON or multipart avatar) |
| `PATCH` | `/api/v1/users/me/hub-sections` | Layer-2 per-section visibility (`hubSections[key].mode`) |
| `GET` | `/api/v1/users/me/navigation` | Owned-entity flags |

### `GET /api/v1/users/:id/hub` — response shape

```ts
type UserHubSectionsProjection = {
  identity?: { firstName?; lastName?; username?; imageUrl?; bio?; businessName?; userType? };
  identification?: { nationality?; phoneNumber?; idType?; idNumber? };
  address?: { location? };
  contact?: { email? };
  entities?: { entities: Array<{ entityType; entityId; name; imageUrl? }> };
};
```

Auth optional. 404 when the user is missing, inactive, or `profileVisibility` blocks the requester. Absent keys mean the viewer lacks access or the owner hid the section.

---

## Three-control visibility model (user)

| Layer | Field | Values | Gate |
|-------|-------|--------|------|
| **L1 — global** | `preferences.profileVisibility` | `public` \| `platform` \| `relationships` \| `private` | Can the profile open at all? Deny → **404** |
| **L2 — hub sections** | `hubSections[key].mode` | `public` \| `relationship` \| `owner` | Which hub sections appear? |
| **Tabs** | — | — | `/user/[userId]` is self-only (`UserPageShell`); no role-based tab filtering |

Hub section keys: `identity` | `identification` | `address` | `contact` | `entities` — 1:1 with the Profile tab sections (Personal / Identification / Address) plus contact (email) and entities (horses). Audiences: `self` ⊇ `relationship`/`collaboration` ⊇ `platform` ⊇ `public`; L2 `relationship` mode maps to the relationship / collaboration audiences; `owner` mode = self only.

**Read flow:** L1 → L2 → return only allowed sections. Do **not** ship the full profile and hide sections in React.

**Server:**
- `buildUserHubSections(userDoc, audience)` — pure cheap projections (identity/identification/address/contact) — `lib/users/userHubSections.ts`
- `canViewUserHubSection(userDoc, key, audience)` — L2 gate
- `getUserHub(userId, requester?)` — L1 404 + sections + entities list — `lib/privacy/userPublicProfile.ts`
- Owner view: `getUserView` seeds `user.sections` (owner sees all) for the account-layout cache

**Autosave:** `UserSectionVisibility` adapter → shared `SectionVisibilityControl` → `useUpdateUserHubSection` → `PATCH /api/v1/users/me/hub-sections`. Popovers live on the Profile tab sections (Personal/Identification/Address), not on the hub.

---

## Web UI

### Public user hub (`/users/[userId]`)

Horse-hub-style public profile page. Reads `GET /api/v1/users/:id/hub` via `useUserHub` (cookie auth optional).

- Page: `app/[locale]/users/[userId]/page.tsx` + `client.tsx` (`UserHubPublicPage`)
- Data: `useUserHub(userId)` → `GET …/hub`
- Layout: full-width identity band + Identification/Address/Contact/Entities sections (read-only, no visibility popovers)

### Owner hub tab (`/user/[userId]`)

Renders the **same** `UserHubContent` from the layout-seeded cache (`user.sections` — no extra request).

- Page: `app/[locale]/user/[userId]/page.tsx` + `client.tsx`
- Data: `useUserView(userId)` → `view.user.sections`
- Visibility popovers are NOT on the hub — they live on the Profile tab sections.

### Hub components (`components/user/hub/`)

```
UserHubContent (reads `sections`)
├── UserHubHero            — identity band (avatar, name, @username, business badge, bio)
├── UserHubIdentification  — nationality, phone, ID type, ID number
├── UserHubAddress         — location
├── UserHubContact         — email
└── UserHubEntities        — owned-horse list (EntityChip → /horses/:id)
```

Each section is wrapped in `SectionErrorBoundary`; renders only `sections` keys present (server-filtered).
