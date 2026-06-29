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
- **No role profiles** linked (`stableProfileIds`, `trainerProfileId`, etc. stay unset)
- **No horses** until the user creates one

They can immediately browse and search stables, trainers, veterinarians, horses, and other discoverable content. Creating a role profile is optional and happens when the user is ready to be listed or operate in that capacity.

## Roles (not separate accounts)

A **role** is a domain profile the same user can create and link to their `User` document:

| Role type | How it links on `User` | Model |
|-----------|------------------------|-------|
| Owner | Implicit when user owns horses (`Horse.mainOwnerUserId`) | `Horse` |
| Stable | `stableProfileIds[]` | `Stable` |
| Breeder | `breederProfileIds[]` | `Breeder` |
| Riding club | `ridingClubProfileIds[]` | `RidingClub` |
| Transport | `transportProfileIds[]` | `Transport` |
| Trainer | `trainerProfileId` (one per user) | `Trainer` |
| Veterinary | `veterinaryProfileId` (one per user) | `Veterinary` |
| Coach | `coachProfileId` (one per user) | `Coach` |
| Rider | `riderProfileId` (one per user) | `Rider` |
| Groom | `groomProfileId` (one per user) | `Groom` |
| Farrier | `farrierProfileId` (one per user) | `Farrier` |

**Syndicate / multi-owner horses** use `Horse.mainOwnerUserId` plus `Horse.coOwners[]` (each entry is a `User` with an ownership percentage) — not a separate role profile.

Each role has its **own model** to complete. Role creation APIs attach the new profile id to the logged-in **User**. These are **subsections of the same person** — not separate signups.

Colloquially people say "stable account" or "vet account"; in the product that always means **User + role profile** (e.g. `User` with `stableProfileIds[]` pointing at a `Stable` document).

Other models (`Relationship`, `Booking`, `Rating`, etc.) refer to **role type** + id via `accountTypeEnums` — meaning "which role profile", not a separate login.

## Web UI routes (placeholders)

Role subsection screens use thin locale routes under `app/[locale]/` (see [`equus/AGENTS.md`](../equus/AGENTS.md) loading conventions):

| Route pattern | Purpose |
|---------------|---------|
| `/stables`, `/groomers`, … | Public discover directory (placeholder) |
| `/my/stables`, … | Owned profile hub — auth required (placeholder) |
| `/create/horse`, `/create/stable`, `/create/breeder`, … | Add a role subsection to the signed-in User (placeholder) |

Create routes use singular folder segments for role profiles (`/create/breeder`) and short segments for multi-ownable types (`/create/horse`, `/create/stable`, `/create/riding-club`, `/create/transport`). Full create flows and APIs are future work.

## Architecture — three diagrams

See full diagrams and Option A rules in [`workplaceRelationship.md`](workplaceRelationship.md).

**Diagram 1:** One `User` → many role subsections (stable, groom, vet, rider, horses as owner, etc.).

**Diagram 2:** Default path — providers collaborate at a **stable profile**; owner accepts **horse ↔ stable** relationship; stable serves hosted horses.

**Diagram 3:** Direct path — owner accepts **horse ↔ provider** relationship (vet, groom, farrier, etc.) without stable in the middle.

## Horse relationship vs stable collaboration

| | Horse relationship | Stable collaboration |
|---|-------------------|------------------------|
| Collection | `Relationship` | `WorkplaceRelationship` |
| Parties | Horse ↔ provider role profile | User ↔ host role profile (e.g. Stable) |
| Consent | Owner (or receiving party per type) | Invited User accepts |
| Example | Owner accepts Dr. Lee (vet) for Comet at home | Carla (groom) collaborates at Sunrise Stable |

### Option A — barn staff access (locked)

A **collaborator** at a stable may write operational data on a horse when **both** are true:

1. Active `WorkplaceRelationship` between the User and that stable profile.
2. Accepted `Relationship` (`type: stable`) between the horse and that stable.

No separate groom↔horse `Relationship` is required for barn staff on hosted horses.

**Direct providers** (e.g. vet at owner's home) need only an accepted horse `Relationship` for that provider type.

## Profile owner vs collaborator

Signup and login are **always one person** (`User`). There is no separate business account.

A User who **owns** a stable adds a **stable role profile** to their account (`stableProfileIds[]` → `Stable` document). They use stable features through that profile — same login.

A User who **collaborates** at someone else's stable is the **same User type** (they may also own horses, a vet profile, groom subsection, etc.). The barn does not own their account. The **profile owner** invites them; they **accept**; a **WorkplaceRelationship** links that User to the host **stable profile**.

Full spec: [`workplaceRelationship.md`](workplaceRelationship.md).

| Concept | Meaning |
|---------|---------|
| **Profile owner** | User who created the role profile (`Stable.userId`, listed on their `stableProfileIds[]`) |
| **Collaborator** | User linked via **WorkplaceRelationship** — never "belongs to" the stable profile |

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
| Initiator | Owner, stable, vet, trainer, etc. | **Profile owner** or admin on that stable profile |
| Receiver | Other party | **Invited User** |
| Pending | `pending` | `invited` |
| After accept | Horse operational data (per Option A or direct link) | Barn permissions + job assignment |
| Stored on | Relationship document | WorkplaceRelationship document |

### Example: groom at barn (Option A)

- **Alice** owns Sunrise Stable (User with `stableProfileIds`).
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
| `manage_collaborators` | yes | yes | no | no |
| `edit_role_profile` | yes | yes | yes | no |
| `view_stable_operations` | yes | yes | yes | yes |

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

The **user profile is always visible** to other users in the platform (subject to future relationship rules). There is no user-level `ownerPreferences` or profile visibility toggle on `User`.

Personal profile completion (`profileComplete` on session/API) is separate: it tracks whether `personalDetails` and address fields are filled for onboarding. The web **profile page** (`/profile`) is where users edit personal details, preferred language, avatar, and address — see [`equus/documentation/profile.md`](../equus/documentation/profile.md).

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

### Planned API

When horse CRUD ships:

- `PATCH /api/v1/horses/:id/discovery` — body validated by `lib/validations/horse.ts` (`updateHorseDiscoverySchema`)

## Removed concepts

| Removed | Reason |
|---------|--------|
| `User.activeAccountContext` | No account switching; navigation is UI-only |
| `User.ownerPreferences` | Visibility/contact moved to per-horse settings; user profile always visible |

Existing database documents may still contain these fields until manually cleaned up; new code does not read or write them.
