# User Module — Feature Specification

Living document for planning, updating, and tracking **user identity, roles, privacy, and cross-cutting access** before and during build.

**Audience:** product, engineering, and GTM — use this file to add, remove, or reprioritize user-facing identity capabilities before implementation starts on each area.

**Related docs:**
- [`equinem.md`](equinem.md) — competitor capability baseline (EquineM)
- [`businessPlan.md`](businessPlan.md) — vision, Section 10.1 User module, multi-role model, discovery rules
- [`mvpScope.md`](mvpScope.md) — build phases vs production launch gate
- [`workplaceRelationship.md`](workplaceRelationship.md) — User ↔ host role profile collaboration (no business account)
- [`horseModule.md`](horseModule.md) — per-horse discovery and owner hub
- [`stableModule.md`](stableModule.md) — stable operations on hosted horses
- [`productFlows.md`](productFlows.md) — onboarding journeys
- [`stack.md`](stack.md) — technical stack and API layout
- [`equus/documentation/profile.md`](../equus/documentation/profile.md) — profile page UI and `PATCH /api/v1/users/me`
- [`userAuthTodo.md`](userAuthTodo.md) — **execution checklist** for user/auth gaps not yet implemented (audit 2026-06-30)
- [`ownershipTransfer.md`](ownershipTransfer.md) — consent-based entity ownership changes (`OwnershipTransfer`)
- [`dataLifecycle.md`](dataLifecycle.md) — no hard deletes; tombstone fields and lifecycle rules

---

## Product principles (user)

1. **One User per person** — every person signs up as a single `User` (one document per email). There is **no account switching** and no persisted `activeAccountContext`.
2. **Browse-first signup** — new users get auth fields only; no role profiles or horses until they choose to create them. They can search stables, trainers, vets, horses, and other discoverable content immediately.
3. **Roles are subsections, not separate accounts** — a stable, vet practice, or trainer listing is a **role profile** on the same login. Colloquial "stable account" means **User + role profile** (`Stable.mainOwnerUserId` or `User.veterinaryProfileId`, etc.).
4. **Two ownership patterns** — **entity-owned** (`mainOwnerUserId` on Horse, Stable, Breeder, Transport, RidingClub; optional `coOwners[]`) vs **user-linked** (one profile per User via `*ProfileId` + `userId` on the role document). Helpers: `lib/ownership/entityOwnership.ts`.
5. **Layered discovery** — **User** privacy (`User.preferences` via `lib/privacy/userVisibility.ts`) is separate from **role-profile** discovery (`isPublic` on Trainer, Stable, etc.) and **horse** discovery (`profileVisibility`, `contactDisplay` on `Horse`). A private user may still operate public horses or listed role profiles.
6. **Entity-first discovery (no people search)** — users search **horses, businesses, and service listings** (role profiles), never other people. There is no global “find people” directory and **no user-level searchable flag**. A personal **user profile page** is a view-only destination reached from entity context (e.g. owner link on a stable card), governed by `profileVisibility` only.
7. **Two access paths for providers** — **horse `Relationship`** (owner ↔ provider on a horse) vs **stable `WorkplaceRelationship`** (User collaborates at a host role profile). Barn staff on hosted horses need **both** active workplace collaboration and accepted horse ↔ stable relationship. Direct providers (e.g. vet at owner's home) need only horse `Relationship`. Full rules: [`workplaceRelationship.md`](workplaceRelationship.md).
8. **Collaborators are Users** — barn staff are never owned by a stable profile. The profile owner invites a User; they accept; permissions live on `WorkplaceRelationship`, not on `User`.
9. **Multi-role single login** — one User may own horses, operate a stable, hold a trainer profile, and collaborate at another barn simultaneously.
10. **No hard deletes** — domain documents are never physically removed in product flows; use `isActive` + deactivation audit fields, status enums, or lifecycle collections (`Relationship`, `OwnershipTransfer`). See [`dataLifecycle.md`](dataLifecycle.md).

---

## How to use this document

| Column / marker | Meaning |
|-----------------|--------|
| **Status: planned** | Agreed scope, not started |
| **Status: in progress** | Actively building |
| **Status: done** | Shipped in production |
| **Parity: EquineM** | Feature exists on competitor (see `equinem.md`) |
| **Beyond** | Differentiator vs EquineM |

Update status as work progresses. Add rows freely; keep IDs stable once referenced in tickets.

Per-role discovery API detail lives in [`equus/documentation/`](../equus/documentation/) (e.g. `horses.md`, `stables.md`, `trainers.md`). Horse-module features live in [`horseModule.md`](horseModule.md); do not duplicate those tables here.

---

## 1. Identity and authentication

| ID | Feature | Parity | Status |
|----|---------|--------|--------|
| U-ID-01 | Credentials signup and login (`POST /api/v1/auth/*`) | Beyond | done |
| U-ID-02 | Google OAuth transport + REST session bridge (web cookies) | Beyond | done |
| U-ID-03 | JWT access + refresh for mobile/API clients | Beyond | done |
| U-ID-04 | One login; navigate between role areas via routes (no account switch) | Beyond | done |
| U-ID-05 | Browse-first account: no roles or horses on signup | Beyond | done |
| U-ID-06 | Email verification flow | Parity | done |
| U-ID-07 | Password reset (request + confirm) | Parity | done |
| U-ID-08 | Session probe and optional silent auth on public pages | Beyond | done |

See [`equus/documentation/auth.md`](../equus/documentation/auth.md).

---

## 2. Personal profile

| ID | Feature | Parity | Status |
|----|---------|--------|--------|
| U-PROF-01 | Personal details PATCH (`PATCH /api/v1/users/me`) | Parity | done |
| U-PROF-02 | Address with geocoding on profile save | Beyond | done |
| U-PROF-03 | Avatar upload (multipart PATCH) | Parity | done |
| U-PROF-04 | `profileComplete` gate for onboarding (`lib/auth/session.ts`) | Beyond | done |
| U-PROF-05 | Preferred language sync (`NEXT_LOCALE` cookie on register/login/profile save) | Beyond | done |
| U-PROF-06 | Profile page UI with skeleton + `LoadingOverlay` (`/profile`) | Beyond | done |
| U-PROF-08 | Global incomplete-profile banner in `AppShell` (link to `/profile`; hidden on `/profile`) | Beyond | done |
| U-PROF-07 | Account deactivation (`DELETE /api/v1/users/me` → `softDelete`; tombstone, not delete) | Beyond | done |

`profileComplete` is separate from discovery visibility — it tracks required `personalDetails` and address fields for onboarding, not whether the user appears on entity cards.

Account deactivation sets `isActive: false`, `deactivatedAt`, `deactivatedByUserId`, revokes refresh tokens, and clears REST cookies. The `User` document is retained for referential integrity — see [`dataLifecycle.md`](dataLifecycle.md) § Account deactivation flow. **Web UI:** `/profile` Account section with confirm dialog (`components/profile/profile-deactivate-account.tsx`) calls `DELETE /api/v1/users/me` and redirects to sign-in. **PII erasure** (GDPR) is a separate step: `anonymizeUserPii` after deactivation — [`equus/documentation/piiAnonymization.md`](../equus/documentation/piiAnonymization.md).

---

## 3. User privacy and visibility

Controlled via `User.preferences` (edited on `/profile`). Enforced in API mappers via [`lib/privacy/userVisibility.ts`](../equus/lib/privacy/userVisibility.ts).

### Discovery model (entity-first)

| What users search | What they do **not** search |
|-------------------|----------------------------|
| Horses, stables, vets, trainers, transport, clubs, breeders, and other **role-profile** listings | Other **people** (`User` records) as a primary search type |

Flow:

1. **Search / browse** → entity card (horse, stable, veterinary practice, trainer profile, …). Only entities are indexed for search (`isPublic` on role profiles, `profileVisibility` on horses).
2. **Optional drill-down** → owner or operator **user profile page** when the entity exposes that link and `profileVisibility` allows it. Users are **never** a search category.
3. **Invite pickers** (e.g. horse hub) use `GET /api/v1/discover/providers` — provider **profiles**, not users.

There is **no** planned global people directory, people search index, or user `searchable` preference (U-PRIV-05 is a **profile page**, not search).

| Field | Values | Default |
|-------|--------|---------|
| `profileVisibility` | `public` \| `platform` \| `relationships` \| `private` | `public` |
| `allowDirectMessagesFrom` | `everyone` \| `relationships` \| `nobody` | `everyone` |

| `profileVisibility` | Anonymous | Signed-in (no link) | Accepted relationship or collaboration |
|---------------------|-----------|---------------------|----------------------------------------|
| `public` | yes | yes | yes |
| `platform` | no | yes | yes |
| `relationships` | no | no | yes |
| `private` | no | no | yes (operational contexts only) |

| ID | Feature | Parity | Status |
|----|---------|--------|--------|
| U-PRIV-01 | `profileVisibility` preference + enforcement | Beyond | done |
| U-PRIV-02 | Users never searchable — entity-only discovery (no `searchable` on User) | Beyond | done |
| U-PRIV-03 | `allowDirectMessagesFrom` preference | Beyond | done |
| U-PRIV-04 | Owner contact on public **horse** cards filtered through user privacy when `useOwnerContact: true` | Beyond | done |
| U-PRIV-05 | Public user profile page (view-only; deep-linked from entities — **never** in search results) | Beyond | done |

### Public user profile (U-PRIV-05 — shipped)

Entity-linked view-only user card. Users are **not** searchable; entry is only from future entity owner/operator links (e.g. stable card → owner).

| Surface | Path | Auth | Notes |
|---------|------|------|-------|
| API | `GET /api/v1/users/:id` | Optional (httpOnly cookie or `Authorization: Bearer`) | Returns `{ user: PublicUserProfileCard }`; `404 NOT_FOUND` when user missing, inactive, or `profileVisibility` blocks requester |
| Web | `/users/[userId]` (locale-prefixed, e.g. `/es/users/…`) | Optional | Skeleton on route nav; card loaded client-side via `lib/api/userClient.ts`; not in discover navigation |

**Service:** `lib/privacy/userPublicProfile.ts` — `getPublicUserForRequester(targetUserId, requester?)` resolves requester audience (`public` / `platform` / `relationship` / `collaboration`) from accepted horse `Relationship` and active host `WorkplaceRelationship`, then maps via `toPublicUserIdentity` + safe display fields.

**Response card fields** (subset; identity fields gated by U-PRIV-01 matrix):

| Field | Notes |
|-------|-------|
| `id` | Always present |
| `firstName`, `lastName`, `email`, `phone` | Omitted when `profileVisibility` blocks requester |
| `username`, `imageUrl`, `bio` | Included when set on profile; not separately gated beyond visibility check. `username` is unique (case-insensitive; sparse index + service check — UA-23) |

No `preferences`, credentials, or full `personalDetails` / address. Full account data remains on `GET /api/v1/users/me`.

**Tests:** `tests/lib/privacy/userPublicProfile.visibilityMatrix.test.ts`, `tests/app/api/v1/users/[id]/route.get.test.ts`.

Developer detail: [`equus/documentation/profile.md`](../equus/documentation/profile.md) § Public read.

Horse discovery (`Horse.profileVisibility`, `Horse.contactDisplay`) is documented in [`horseModule.md`](horseModule.md) §3 and [`equus/documentation/horses.md`](../equus/documentation/horses.md).

---

## 4. Roles and ownership model

### Patterns

| Pattern | Link | Examples | Multi per User |
|---------|------|----------|----------------|
| **Entity-owned** | `mainOwnerUserId` on entity (+ optional `coOwners[]`) | Horse, Stable, RidingClub, Transport, Breeder | Yes (except Horse: many horses, many stables, etc.) |
| **User-linked** | `User.*ProfileId` + `userId` on role doc | Trainer, Veterinary, Coach, Groom, Farrier, Rider | One profile per role type per User (409 on second create) |

**Co-owners** (`coOwners[]`: `userId`, `ownershipPercentage`, `isBillingResponsible`) on Horse, Stable, RidingClub, Transport, Breeder grant profile-owner capabilities (navigation, workplaces, collaboration invites). This is **ownership**, not operational staff — staff use `WorkplaceRelationship`.

**Ownership changes** (who is main owner, who is in `coOwners[]`) use the **`OwnershipTransfer`** collection — consent required before any change applies. Applies only to **entity-owned** types above; **not** user-linked services (trainer, vet, groom, etc.). See [`ownershipTransfer.md`](ownershipTransfer.md).

`Relationship`, `Booking`, `Rating`, etc. use `accountTypeEnums` — role profiles (`stable`, `trainer`, …) or `horse` for the ownership side of a horse link (user operator, not a `User.*ProfileId`).

### Ownership transfer kinds (locked)

| Kind | Purpose | Precondition |
|------|---------|--------------|
| `transfer_main` | Hand entity to another user (sale / gift) | `coOwners[]` **empty** (each removal accepted via `remove_co_owner` first) |
| `remove_co_owner` | Main owner removes a co-owner | Target user is in `coOwners[]`; **co-owner accepts** exclusion |
| `promote_co_owner` | Co-owner becomes main owner | Target is in `coOwners[]`; **co-owner accepts**; other co-owners **remain** |

Until accept: entity `mainOwnerUserId` and `coOwners[]` are unchanged. On accept for `transfer_main` / `promote_co_owner`: former main owner **loses** owner access.

| ID | Feature | Parity | Status |
|----|---------|--------|--------|
| U-ROLE-01 | Entity-owned models with `mainOwnerUserId` | Beyond | done |
| U-ROLE-02 | User-linked models with `*ProfileId` on User | Beyond | done |
| U-ROLE-03 | `coOwners[]` embed on entity-owned models | Parity | done |
| U-ROLE-04 | Ownership helpers (`lib/ownership/entityOwnership.ts`) | Beyond | done |
| U-ROLE-05 | User-linked ownership helpers (`lib/*/userLinkedProfileAccess.ts`) | Beyond | done |
| U-ROLE-06 | `OwnershipTransfer` model + APIs (`transfer_main`, `remove_co_owner`, `promote_co_owner`) | Beyond | done |
| U-ROLE-07 | Ownership transfer inbox UI (`/ownership-transfers`) | Beyond | done |

### Create APIs (baseline shipped)

| Kind | `POST` path | Notes |
|------|-------------|-------|
| Horse | `/api/v1/horses` | Sets `mainOwnerUserId`, `createdByUserId`; web UI at `/horses/new` |
| Stable | `/api/v1/stables` | Entity-owned |
| Transport | `/api/v1/transports` | Entity-owned |
| Breeder | `/api/v1/breeders` | Entity-owned; multiple per User |
| Trainer | `/api/v1/trainers` | User-linked; 409 if `trainerProfileId` set |
| Groom | `/api/v1/grooms` | User-linked |
| Coach | `/api/v1/coaches` | User-linked |
| Farrier | `/api/v1/farriers` | User-linked |
| Rider | `/api/v1/riders` | User-linked |
| Veterinary | `/api/v1/veterinaries` | User-linked |

Do **not** write horse/stable arrays on `User` for entity-owned types.

---

## 5. Navigation and web UI

| Route pattern | Purpose |
|---------------|---------|
| `/` | Guest marketing landing — signed-in users redirect to `/home` |
| `/home` | Signed-in user home hub — welcome, add horse, owned subsection links (`components/home/user-home-page.tsx`) |
| `/me` | Legacy redirect → `/home` |
| `/profile` | Account settings — personal details, preferences, deactivation (not post-auth landing) |
| `/users/[userId]` | Public user profile card — entity-linked only; not in discover nav (U-PRIV-05) |
| `/stables`, `/groomers`, … | Public discover directory for **entities** (horses, businesses, services — not people; mostly placeholder) |
| `/stables`, `/horses`, … | Owned profile hub — auth required (mostly placeholder) |
| `/horses/new`, `/stables/new`, `/horses/new`, … | Add a role subsection (horse create **shipped**; others placeholder) |

Create routes: canonical `/<entity>/new` pattern — `/horses/new`, `/trainers/new`, `/groomers/new`, `/riding-clubs/new`, `/stables/new`, `/transport/new`.

| ID | Feature | Parity | Status |
|----|---------|--------|--------|
| U-NAV-01 | `GET /api/v1/users/me/navigation` owned flags | Beyond | done |
| U-NAV-02 | App shell: discover sidebar + header (`AppShell`) | Beyond | done |
| U-NAV-03 | Create-horse web flow (`/horses/new`) | Beyond | done |
| U-NAV-04 | Create flows for other role types (web UI) | Parity | planned |
| U-NAV-05 | Owned hubs with real lists (`/<entity>`) | Parity | planned |
| U-NAV-06 | Public user profile page (`/users/[userId]`) + `GET /api/v1/users/:id` | Beyond | done |

---

## 6. Horse access vs stable collaboration

| | Horse relationship | Stable collaboration |
|---|-------------------|------------------------|
| Collection | `Relationship` | `WorkplaceRelationship` |
| Parties | Horse ↔ provider role profile | User ↔ host role profile (e.g. Stable) |
| Consent | Horse owner / receiving party per type | Invited User accepts |
| Example | Owner accepts Dr. Lee (vet) for Comet at home | Carla (groom) collaborates at Sunrise Stable |

### Barn staff access (locked policy)

A **collaborator** at a stable may write operational data on a hosted horse when **both**:

1. Active `WorkplaceRelationship` between the User and that stable profile.
2. Accepted `Relationship` (`relationshipType: stable`) between the horse and that stable.

No separate groom↔horse `Relationship` is required for barn staff on hosted horses.

**Direct providers** (e.g. vet at owner's home) need only an accepted horse `Relationship` for that provider type.

### Invitation policy (locked)

| Tier | Who initiates | Mechanism | May invite |
|------|---------------|-----------|------------|
| **Horse** | Horse owner / co-owner only | `Relationship` | Any provider type (stable, ridingClub, breeder, transport, veterinary, trainer, groom, farrier, rider, coach) |
| **Host entity** (`Stable`, `RidingClub`, `Breeder`, `Transport`) | Profile owner / admin | `WorkplaceRelationship` | **Services only** — veterinary, trainer, groom, farrier, coach, rider (Users) |
| **Service** (trainer, vet, groom, …) | **Never** | Inbox only | Accept/decline at `/relationships` and `/workplaces` |

- **Offline first** — agree in chat or in person, then send the formal invite.
- **Groom at barn** — host invites groom via workplace; not a horse `Relationship`.
- **Groom at owner home** — horse owner invites groom via horse `Relationship`.
- Host entities **do not** invite horses or other host listings. Horse hosting is always owner → stable (or other host provider).

| ID | Feature | Parity | Status |
|----|---------|--------|--------|
| U-ACCESS-01 | Horse ↔ provider `Relationship` model and enums | Beyond | done |
| U-ACCESS-02 | Barn staff dual-gate policy documented and enforced in services | Beyond | done |
| U-ACCESS-03 | Relationship send / accept / decline APIs | Beyond | done |
| U-ACCESS-04 | Email invitation for unregistered party on relationship | Beyond | done |
| U-ACCESS-05 | Non-public role discovery bypass via accepted horse relationship only | Beyond | done |

Architecture diagrams and examples: [`workplaceRelationship.md`](workplaceRelationship.md), [`productFlows.md`](productFlows.md). API detail: [`equus/documentation/relationships.md`](../equus/documentation/relationships.md).

---

## 7. Workplace collaboration

Signup and login are **always one person** (`User`). A User who **owns** a stable creates a `Stable` with `mainOwnerUserId`. A User who **collaborates** is invited by the profile owner, accepts, and is linked via `WorkplaceRelationship` (hierarchy: `admin` | `manager` | `staff` on the link, not on User).

| Capability | Profile owner | admin | manager | staff |
|------------|---------------|-------|---------|-------|
| `manage_role_profile` | yes | yes | no | no |
| `edit_role_profile` | yes | yes | yes | no |
| `view_role_profile` | yes | yes | yes | yes |

| ID | Feature | Parity | Status |
|----|---------|--------|--------|
| U-WORK-01 | `GET /api/v1/users/me/workplaces` | Beyond | done |
| U-WORK-02 | Accept / decline workplace invitation | Beyond | done |
| U-WORK-03 | `POST/GET/PATCH/DELETE` role-profile workplace-relationships | Beyond | done |
| U-WORK-04 | Staff roster CRUD on host profile | Beyond | done |
| U-WORK-05 | Multi-stable employment (same User, multiple collaborations) | Parity | done |
| U-WORK-06 | `assign_activities` capability (activity modules) | Parity | planned |

Full spec: [`workplaceRelationship.md`](workplaceRelationship.md).

---

## 8. Role discovery registry

Role-profile discovery is **per document**, not per User. Business contact lives on the role entity (or horse), not routed through `User.preferences` except when a horse uses `contactDisplay.useOwnerContact: true`.

**Entity-owned** — `isPublic` (default `true`); when `false`, visible to owner/co-owner, active collaborators, and users with accepted horse ↔ entity `Relationship`. Optional operational flags (`acceptsNewHorses`, `acceptsNewBookings`, etc.) vary by type.

**User-linked** — `isPublic` (default `true`); when `false`, visible to profile owner (`userId`) and users with accepted horse ↔ role `Relationship`. Barn `WorkplaceRelationship` is **operational only** — not a discovery bypass for non-public listings.

| Role | Ownership | Discovery doc | Baseline API |
|------|-----------|---------------|--------------|
| Horse | Entity | [`equus/documentation/horses.md`](../equus/documentation/horses.md) | `POST` / `PATCH …/discovery` / `GET` — done |
| Stable | Entity | [`equus/documentation/stables.md`](../equus/documentation/stables.md) | done |
| Breeder | Entity | [`equus/documentation/breeders.md`](../equus/documentation/breeders.md) | done |
| Transport | Entity | [`equus/documentation/transports.md`](../equus/documentation/transports.md) | done |
| Trainer | User-linked | [`equus/documentation/trainers.md`](../equus/documentation/trainers.md) | done |
| Groom | User-linked | [`equus/documentation/grooms.md`](../equus/documentation/grooms.md) | done |
| Veterinary | User-linked | [`equus/documentation/veterinaries.md`](../equus/documentation/veterinaries.md) | done |
| Coach | User-linked | [`equus/documentation/coaches.md`](../equus/documentation/coaches.md) | done |
| Farrier | User-linked | [`equus/documentation/farriers.md`](../equus/documentation/farriers.md) | done |
| Rider | User-linked | [`equus/documentation/riders.md`](../equus/documentation/riders.md) | done |
| Riding club | Entity | [`equus/documentation/riding-clubs.md`](../equus/documentation/riding-clubs.md) | done |

Riding club baseline API is implemented; hub UI and events remain future work.

---

## 9. Beyond EquineM (user-centric differentiators)

| ID | Feature | Status |
|----|---------|--------|
| U-DIFF-01 | Multi-role single login (owner + trainer + stable on one User) | done |
| U-DIFF-02 | Browse-first: explore ecosystem before creating any role | done |
| U-DIFF-03 | Three-layer discovery: user privacy + role listing + horse visibility | done |
| U-DIFF-04 | Independent provider accounts on same horse (network, not org roster) | planned |
| U-DIFF-05 | Collaborators as Users with invite/accept (not business sub-accounts) | done |
| U-DIFF-06 | Portable horse record across stables and providers | planned |
| U-DIFF-07 | Unified owner dashboard across providers | planned |

---

## 10. Production readiness (user slice)

The user module is **production-ready** when every feature required for launch in Sections 1–7 above is `done` and acceptance criteria pass.

Cross-module production gate (all must be ready together): see [`mvpScope.md`](mvpScope.md) — **Production launch requirements** (User, Horse, Veterinary, Stable modules).

### User launch acceptance (summary)

- [ ] Signup/login (credentials + Google) and personal profile at EquineM parity
- [ ] Browse-first: new users can discover without creating roles
- [ ] Multi-role navigation reflects owned profiles and collaborations
- [ ] User privacy preferences enforced on personal and delegated horse contact
- [x] Public user profile (`GET /api/v1/users/:id`, `/users/[userId]`) respects `profileVisibility` for all audiences (U-PRIV-05)
- [ ] Workplace invite → accept → hierarchy; collaborator never gains entity ownership
- [ ] Barn staff horse access follows dual-gate policy
- [ ] Horse ↔ provider relationship invite/accept completes in minutes
- [ ] All role baseline create + discovery APIs shipped for in-scope role types
- [ ] Create web flows for primary role types (at minimum horse + stable + trainer + vet)

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-30 | Initial module spec — living doc pattern for user identity/roles; role discovery detail in `equus/documentation/*.md` registry |
| 2026-06-30 | Create-horse web UI; veterinary baseline API shipped |
| 2026-06-29 | Entity-owned `mainOwnerUserId`; collaborators as Users; workplace APIs |
| 2026-06-30 | Entity-first discovery locked: no people search; removed `User.preferences.searchable`; only entities are searchable |
| 2026-06-30 | OwnershipTransfer spec: consent-based `transfer_main`, `remove_co_owner`, `promote_co_owner`; entity-owned only |
| 2026-06-30 | U-PRIV-05 shipped: `GET /api/v1/users/:id`, `/users/[userId]` web page; visibility matrix tests |
| 2026-06-30 | U-PROF-07 shipped: account deactivation UI on `/profile` (UA-10) |
| 2026-06-30 | U-PROF-08 shipped: global incomplete-profile banner in AppShell (UA-12) |
