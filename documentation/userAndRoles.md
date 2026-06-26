# User Identity, Roles, and Discovery

Canonical reference for how one person maps to one login, optional roles, and per-horse discovery settings.

Related:
- [`stack.md`](stack.md) — technical stack and API layout
- [`productFlows.md`](productFlows.md) — onboarding journeys
- [`equus/models/User.ts`](../equus/models/User.ts), [`equus/models/Horse.ts`](../equus/models/Horse.ts)

---

## One user, one login

- Every person signs up as a **User** (one document per email).
- There is **no account switching** and no persisted “active context” on the user.
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

Each role has its **own model** to complete. Role creation APIs are added per domain module; they attach the new profile id to the logged-in user.

Other models (`Relationship`, `Booking`, `Rating`, etc.) refer to **role type** + id via `accountTypeEnums` — meaning “which role profile”, not a separate login.

## Ownership vs workplace access (staff)

Business role profiles (stable, breeder, riding club, transport) can have **workers** who are ordinary `User` documents — not owners and not added to `User.*ProfileIds`.

| Concept | Storage | Meaning |
|---------|---------|---------|
| **Owner** | `Stable.userId` (etc.) + owner's `stableProfileIds[]` | Created and owns the business profile |
| **Staff** | `RoleMembership` collection | Invited by email to work on someone else's profile |

### Invite by email

1. Owner creates their stable (or other business role) and invites a person **by email**.
2. **Email already registered** — `RoleMembership` is created with `status: invited` and `userId` set. Invitee logs in, sees the pending invite, and **accepts or declines**.
3. **Email not registered** — invite row stores `invitedEmail` only. Person **signs up** with that email; pending invites are linked automatically; they then **accept or decline**. Signup alone does not grant access.

### Example: stable owner invites an existing vet

- **Alice** owns Sunrise Stable.
- **Bob** is already on the app as a veterinarian (`User.veterinaryProfileId`).
- Alice invites `bob@clinic.com` to work on her stable as `manager`.
- Bob accepts → he can view and operate per his staff role, but **`User.stableProfileIds` is unchanged** and he keeps his vet profile.

### Staff roles and capabilities

Preset levels on `RoleMembership.staffRole`:

| Capability | Owner | admin | manager | staff |
|------------|-------|-------|---------|-------|
| `manage_staff` | yes | yes | no | no |
| `edit_profile` | yes | yes | yes | no |
| `view_profile` | yes | yes | yes | yes |

Owner, **admin**, or **manager** staff may edit the business profile document. Only **owner** or **admin** staff may manage other staff. Future `PATCH` routes for stables/breeders/etc. use `requireRoleProfileAccess(..., "edit_profile")`.

### Staff API

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/v1/role-profiles/:roleType/:roleProfileId/staff` | List staff (owner/admin) |
| `POST` | same | Invite by email |
| `PATCH` | `.../staff/:membershipId` | Update staff role |
| `DELETE` | `.../staff/:membershipId` | Revoke membership |
| `GET` | `/api/v1/users/me/workplaces` | Owned profiles + staff workplaces + pending invites |
| `POST` | `/api/v1/users/me/memberships/:membershipId/accept` | Accept invite |
| `POST` | `/api/v1/users/me/memberships/:membershipId/decline` | Decline invite |

`roleType`: `stable` | `breeder` | `ridingClub` | `transport`

## User profile visibility

The **user profile is always visible** to other users in the platform (subject to future relationship rules). There is no user-level `ownerPreferences` or profile visibility toggle on `User`.

Personal profile completion (`profileComplete` on session/API) is separate: it tracks whether `personalDetails` and address fields are filled for onboarding.

## Horse discovery (per horse)

Visibility and public contact are **per horse**, not per user.

### `Horse.profileVisibility`

Enum: `public` | `relationship` | `owner_only`

- Default for new horses: **`public`**
- Owner can restrict each horse individually (e.g. one horse public, another visible only to relationships)

### `Horse.contactDisplay`

| Field | Purpose |
|-------|---------|
| `useOwnerContact` (default `true`) | Show main owner’s contact from `User.personalDetails` |
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
