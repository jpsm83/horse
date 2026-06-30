# User Identity, Roles, and Discovery

Canonical reference for how one person maps to one login, optional roles, and per-horse discovery settings.

Related:
- [`stack.md`](stack.md) — technical stack and API layout
- [`productFlows.md`](productFlows.md) — onboarding journeys
- [`workplaceRelationship.md`](workplaceRelationship.md) — stable collaboration (User ↔ role profile)
- [`equus/models/User.ts`](../equus/models/User.ts), [`equus/models/Horse.ts`](../equus/models/Horse.ts)

---

## One user, one login

- Every person signs up as a **User** (one document per email).
- There is **no account switching** and no persisted "active context" on the user.
- After login, the app navigates between areas (my horses, my stable, search, etc.) via UI routes — not by swapping accounts.

## Signup: browse first, roles later

New users are created with:

- Auth fields only (`personalDetails.email`, password or Google link, etc.)
- **No role profiles** linked (`trainerProfileId`, `groomProfileId`, etc. stay unset)
- **No horses** until the user creates one

They can immediately browse and search stables, trainers, veterinarians, horses, and other discoverable content. Creating a role profile is optional and happens when the user is ready to be listed or operate in that capacity.

## Roles (not separate accounts)

A **role** is a domain profile the same user can create and operate in. Ownership uses two patterns:

| Pattern | Meaning | Examples |
|---------|---------|----------|
| **Entity-owned** | Operator is stored on the entity document; not mirrored on `User` | `mainOwnerUserId` on Horse, Stable, RidingClub, Transport, Breeder; `coOwners[]` on Horse, Stable, RidingClub, Transport, Breeder |
| **User-linked** | One profile per user via `*ProfileId` on `User` plus `userId` on the role document | `trainerProfileId`, `groomProfileId`, … |

| Role type | How it links | Model |
|-----------|--------------|-------|
| Horses | `Horse.mainOwnerUserId` (+ optional `coOwners[]`) | `Horse` |
| Stable | `Stable.mainOwnerUserId` (+ optional `coOwners[]`; user may operate many) | `Stable` |
| Riding club | `RidingClub.mainOwnerUserId` (+ optional `coOwners[]`) | `RidingClub` |
| Transport | `Transport.mainOwnerUserId` (+ optional `coOwners[]`; user may operate many) | `Transport` |
| Breeder | `Breeder.mainOwnerUserId` (+ optional `coOwners[]`; user may operate many) | `Breeder` |
| Trainer | `trainerProfileId` (one per user) | `Trainer` |
| Veterinary | `veterinaryProfileId` (one per user) | `Veterinary` |
| Coach | `coachProfileId` (one per user) | `Coach` |
| Rider | `riderProfileId` (one per user) | `Rider` |
| Groom | `groomProfileId` (one per user) | `Groom` |
| Farrier | `farrierProfileId` (one per user) | `Farrier` |

**Multi-owner entities** use `mainOwnerUserId` plus optional `coOwners[]` (shared embed: `userId`, `ownershipPercentage`, `isBillingResponsible`) on **Horse**, **Stable**, **RidingClub**, **Transport**, and **Breeder**. Co-owners get full profile-owner capabilities (navigation, workplaces, collaboration invites). This is **ownership**, not operational staff — staff use `WorkplaceRelationship`.

Each role has its **own model** to complete. These are **subsections of the same person** — not separate signups.

**Create APIs:**

- **Horse / stable / riding club / transport / breeder:** set `mainOwnerUserId` on the new entity (`POST /api/v1/horses`, `/stables`, `/transports`, `/breeders`); optional `coOwners[]` when partnership APIs ship. Do not write arrays on `User`.
- **Trainer / vet / coach / groom / rider / farrier:** create the role document with `userId` and set the matching `*ProfileId` on `User` in the same transaction; reject if that `*ProfileId` is already set (`POST /api/v1/trainers` for trainer).

Colloquially people say "stable account" or "vet account"; in the product that always means **User + role profile** (e.g. a `Stable` with `mainOwnerUserId`, or `User` with `veterinaryProfileId` pointing at their vet profile).

Other models (`Relationship`, `Booking`, `Rating`, etc.) refer to party kind + id via `accountTypeEnums` — role profiles (`stable`, `trainer`, …) or `horse` for the ownership side of a horse link (user operator, not a `User.*ProfileId`). Not a separate login.

## Web UI routes (placeholders)

Role subsection screens use thin locale routes under `app/[locale]/` (see [`equus/AGENTS.md`](../equus/AGENTS.md) loading conventions):

| Route pattern | Purpose |
|---------------|---------|
| `/stables`, `/groomers`, … | Public discover directory (placeholder) |
| `/my/stables`, … | Owned profile hub — auth required (placeholder) |
| `/create/horse`, `/create/stable`, `/create/breeder`, … | Add a role subsection to the signed-in User (placeholder) |

Create routes use singular folder segments for user-linked role profiles (`/create/trainer`, `/create/groom`, …) and short segments for entity-owned types (`/create/horse`, `/create/stable`, `/create/riding-club`, `/create/transport`). Minimal create APIs ship for **horse**, **stable**, **transport**, **breeder**, and **trainer** (`POST /api/v1/trainers`); web create flows remain placeholders.

## Architecture — three diagrams

See full diagrams and horse access rules in [`workplaceRelationship.md`](workplaceRelationship.md).

**Diagram 1:** One `User` → many subsections (horses, stable, riding club entity-owned, groom, vet, rider, etc.).

**Diagram 2:** Default path — providers collaborate at a **stable profile**; horse owner accepts **horse ↔ stable** relationship; stable serves hosted horses.

**Diagram 3:** Direct path — horse owner accepts **horse ↔ provider** relationship (vet, groom, farrier, etc.) without stable in the middle.

## Horse relationship vs stable collaboration

| | Horse relationship | Stable collaboration |
|---|-------------------|------------------------|
| Collection | `Relationship` | `WorkplaceRelationship` |
| Parties | Horse ↔ provider role profile | User ↔ host role profile (e.g. Stable) |
| Consent | Horse owner / receiving party per type | Invited User accepts |
| Example | Horse owner accepts Dr. Lee (vet) for Comet at home | Carla (groom) collaborates at Sunrise Stable |

### Barn staff access (locked)

A **collaborator** at a stable may write operational data on a horse when **both** are true:

1. Active `WorkplaceRelationship` between the User and that stable profile.
2. Accepted `Relationship` (`type: stable`) between the horse and that stable.

No separate groom↔horse `Relationship` is required for barn staff on hosted horses.

**Direct providers** (e.g. vet at owner's home) need only an accepted horse `Relationship` for that provider type.

## Profile owner vs collaborator

Signup and login are **always one person** (`User`). There is no separate business account.

A User who **owns** a stable creates a **stable role profile** (`Stable` with `mainOwnerUserId` set to their account). They use stable features through that profile — same login.

A User who **collaborates** at someone else's stable is the **same User type** (they may also own horses, a vet profile, groom subsection, etc.). The barn does not own their account. The **profile owner** invites them; they **accept**; a **WorkplaceRelationship** links that User to the host **stable profile**.

Full spec: [`workplaceRelationship.md`](workplaceRelationship.md).

| Concept | Meaning |
|---------|---------|
| **Profile owner** | User who operates the role profile (`mainOwnerUserId` or `coOwners[]` on entity-owned host profiles; `*ProfileId` on User for trainer/vet/etc.) |
| **Collaborator** | User linked via **WorkplaceRelationship** — never granted ownership on the entity |

### Collaboration invitation flow

```
Profile owner (or admin on that stable) sends collaboration invitation to User (by email)
  → User notified (in-app + email)
  → User accepts or declines
  → On accept: collaboration active (User ↔ stable role profile); id on Stable.collaborators[]
  → Profile owner side sets hierarchy on that collaboration (admin | manager | staff)
  → Activities/jobs assigned per permissions on that link
```

| Step | Horse relationship (`Relationship`) | Stable collaboration (`WorkplaceRelationship`) |
|------|-------------------------------------|-----------------------------------------------|
| Initiator | Horse owner, stable, vet, trainer, etc. | **Profile owner** or admin on that stable profile |
| Receiver | Other party | **Invited User** |
| Pending | `pending` | `invited` |
| After accept | Horse operational data (barn collaboration path or direct link) | Barn permissions + job assignment |
| Stored on | Relationship document | WorkplaceRelationship document |

### Example: groom at barn

- **Alice** owns Sunrise Stable (`Stable.mainOwnerUserId` → Alice).
- **Bob** owns horse Comet; accepts stable hosting (`Relationship` horse ↔ Sunrise Stable).
- Alice invites **Carla** (User with groom subsection). Carla accepts collaboration.
- Carla may log feed/care on Comet **without** a separate groom↔Comet `Relationship`.

### Example: vet at owner's home (direct path)

- **Bob** owns Comet. Invites **Dr. Lee**'s veterinary profile directly.
- Bob accepts. Dr. Lee writes health records. Sunrise Stable not required.

### Example: collaborator at two stables

- **Carla** is one User (one login).
- Sunrise Stable invites Carla → she **accepts** → collaboration active; hierarchy `staff`.
- Valley Barn invites Carla → separate collaboration.
- Carla chooses workplaces from her dashboard; scheduling checks conflicts across both links.

### Hierarchy and capabilities (per collaboration)

Levels on the **WorkplaceRelationship** (`admin` | `manager` | `staff`), not on the User:

| Capability | Profile owner | admin | manager | staff |
|------------|---------------|-------|---------|-------|
| `manage_role_profile` | yes | yes | no | no |
| `edit_role_profile` | yes | yes | yes | no |
| `view_role_profile` | yes | yes | yes | yes |

`assign_activities` is planned for future activity modules and is not yet part of the current capability set.

### Planned API

| Method | Path (illustrative) | Purpose |
|--------|---------------------|---------|
| `GET` | `/api/v1/role-profiles/:roleType/:id/workplace-relationships` | List collaborations (profile owner/admin) |
| `POST` | same | Send collaboration invitation |
| `PATCH` | `.../workplace-relationships/:id` | Update hierarchy or collaboration fields |
| `DELETE` | `.../workplace-relationships/:id` | End collaboration |
| `GET` | `/api/v1/users/me/workplaces` | Owned role profiles + collaborations + pending invites |
| `POST` | `/api/v1/users/me/workplace-invitations/:id/accept` | User accepts |
| `POST` | `/api/v1/users/me/workplace-invitations/:id/decline` | User declines |

`roleType`: `stable` | `breeder` | `ridingClub` | `transport`

## User profile visibility

Each user controls how their **personal profile** is exposed via `User.preferences` (edited on `/profile`):

| Field | Values | Purpose |
|-------|--------|---------|
| `profileVisibility` | `public` \| `platform` \| `relationships` \| `private` | Who can see profile identity and contact fields |
| `searchable` | `true` \| `false` | Include profile in search and suggestions |
| `allowDirectMessagesFrom` | `everyone` \| `relationships` \| `nobody` | Who may start direct messages |

Defaults for new users: `public`, `searchable: true`, `allowDirectMessagesFrom: everyone`.

**Exposure rules** (enforced in API mappers via `lib/privacy/userVisibility.ts`):

| `profileVisibility` | Anonymous | Signed-in (no link) | Accepted relationship or collaboration |
|---------------------|-----------|---------------------|----------------------------------------|
| `public` | yes | yes | yes |
| `platform` | no | yes | yes |
| `relationships` | no | no | yes |
| `private` | no | no | yes (operational contexts only) |

User preferences apply to the **person** (`User`). Role-profile discovery (groom, trainer, stable directory, etc.) and horse discovery are separate layers — a private user can still operate public horses or listed role profiles.

`profileComplete` (session/API) is separate: it tracks whether required `personalDetails` and address fields are filled for onboarding. See [`equus/documentation/profile.md`](../equus/documentation/profile.md).

## Horse discovery (per horse)

Visibility and public contact are **per horse**, not per user.

### `Horse.profileVisibility`

Enum: `public` | `relationship` | `owner_only`

- Default for new horses: **`public`**
- Owner can restrict each horse individually (e.g. one horse public, another visible only to relationships)

### `Horse.contactDisplay`

| Field | Purpose |
|-------|---------|
| `useOwnerContact` (default `true`) | Show main owner's contact from `User.personalDetails` |
| `name`, `phone`, `email` | Delegate contact when `useOwnerContact` is `false` |

Example: user owns the horse but wants inquiries to go to a stable manager — set `useOwnerContact: false` and fill delegate fields.

### Horse API

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/v1/horses` | Create horse (`mainOwnerUserId`, `createdByUserId`) |
| `PATCH` | `/api/v1/horses/:id/discovery` | Update `profileVisibility` / `contactDisplay` (owner/co-owner) |
| `GET` | `/api/v1/horses/:id` | Public horse card (optional auth) |

See [`equus/documentation/horses.md`](../equus/documentation/horses.md).

## Stable discovery (per stable)

Visibility and public contact are **per stable** (entity-owned business profile), not per user.

### `Stable.isPublic`

Boolean (default **`true`**). When `false`, the stable is hidden from anonymous discovery and unrelated signed-in users. Still visible to owner/co-owner, active collaborators at the stable, and users with an accepted horse ↔ stable `Relationship`.

### `Stable.acceptsNewHorses`

Boolean (default **`true`**). Operational flag for whether the stable is accepting new boarding clients (surfaced on public card).

Business contact (`tradeName`, `email`, `phoneNumber`) is stored on the `Stable` document — not routed through `User.preferences`. A private user may still operate a public stable listing.

### Stable API

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/v1/stables` | Create stable (`mainOwnerUserId`) |
| `PATCH` | `/api/v1/stables/:id/discovery` | Update `isPublic` / `acceptsNewHorses` (owner/co-owner) |
| `GET` | `/api/v1/stables/:id` | Public stable card (optional auth) |

See [`equus/documentation/stables.md`](../equus/documentation/stables.md).

## Breeder discovery (per breeding operation)

Visibility and public contact are **per breeder entity**, not per user. A User may operate multiple `Breeder` documents.

### `Breeder.isPublic`

Boolean (default **`true`**). When `false`, hidden from anonymous discovery and unrelated signed-in users. Still visible to owner/co-owner, active collaborators at the breeder, and users with an accepted horse ↔ breeder `Relationship`.

Business contact (`operationName`, `email`, `phoneNumber`) is stored on the `Breeder` document — not routed through `User.preferences`.

### Breeder API

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/v1/breeders` | Create breeder (`mainOwnerUserId`) |
| `PATCH` | `/api/v1/breeders/:id/discovery` | Update `isPublic` (owner/co-owner) |
| `GET` | `/api/v1/breeders/:id` | Public breeder card (optional auth) |

See [`equus/documentation/breeders.md`](../equus/documentation/breeders.md).

## Transport discovery (per transport company)

Visibility and public contact are **per transport entity**, not per user. A User may operate multiple `Transport` documents.

### `Transport.isPublic`

Boolean (default **`true`**). When `false`, hidden from anonymous discovery and unrelated signed-in users. Still visible to owner/co-owner, active collaborators at the transport company, and users with an accepted horse ↔ transport `Relationship`.

### `Transport.acceptsNewBookings`

Boolean (default **`true`**). Operational flag for whether the company is accepting new transport bookings (surfaced on public card).

Business contact (`companyName`, `email`, `phoneNumber`, `emergencyPhoneNumber`) is stored on the `Transport` document — not routed through `User.preferences`.

### Transport API

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/v1/transports` | Create transport company (`mainOwnerUserId`) |
| `PATCH` | `/api/v1/transports/:id/discovery` | Update `isPublic` / `acceptsNewBookings` (owner/co-owner) |
| `GET` | `/api/v1/transports/:id` | Public transport card (optional auth) |

See [`equus/documentation/transports.md`](../equus/documentation/transports.md).

## Trainer discovery (per trainer profile)

Visibility and public contact are **per trainer profile** (user-linked — one per User).

### `Trainer.isPublic`

Boolean (default **`true`**). When `false`, hidden from anonymous discovery and unrelated signed-in users. Still visible to the profile owner (`Trainer.userId`) and users with an accepted horse ↔ trainer `Relationship`.

### `Trainer.acceptsNewClients`

Boolean (default **`true`**). Operational flag for whether the trainer is accepting new clients (surfaced on public card).

Business contact (`displayName`, `email`, `phoneNumber`) is stored on the `Trainer` document — not routed through `User.preferences`.

### Trainer API

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/v1/trainers` | Create trainer (`userId` + `User.trainerProfileId`; 409 if already set) |
| `PATCH` | `/api/v1/trainers/:id/discovery` | Update `isPublic` / `acceptsNewClients` (profile owner) |
| `GET` | `/api/v1/trainers/:id` | Public trainer card (optional auth) |

See [`equus/documentation/trainers.md`](../equus/documentation/trainers.md).
