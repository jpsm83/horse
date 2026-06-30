# Product Flows — Onboarding And Core Journeys

User journeys for account creation, relationships, and day-one workflows.

Source:
- `businessPlan.md` — Section 10, Section 14, Section 18 (Phase 11)
- `mvpScope.md` — Phase 1A boundaries
- `stack.md` — technical implementation

---

## Technical mapping (implementation)

| Flow step | Backend |
|-----------|---------|
| Signup / login | Auth.js (web) or `POST /api/v1/auth/*` (mobile) |
| Create horse / stable / transport / breeder / trainer / groom / coach / farrier / rider / veterinary | REST API + Zod validation + `lib/services` |
| Relationship invite (horse) | `POST /api/v1/relationships` — **horse owner only** initiates |
| Relationship accept / decline | `PATCH /api/v1/relationships/:id` — provider accepts or declines |
| Staff invite / accept | Host entity (`Stable`, `RidingClub`, `Breeder`, `Transport`) invites **service Users** only — see [`workplaceRelationship.md`](workplaceRelationship.md) |
| Chat | REST messages (1A); Socket.io when realtime ships |
| Uploads | Cloudinary via API route |
| Reviews | `Rating` tied to `relationshipId` + `horseId`; bidirectional between relationship parties |

Provider links (vet, stable, trainer, etc.) are **not** stored on `Horse` directly — query accepted `Relationship` documents by `horseId`.

---

## Global rules (all roles)

1. **User first** — everyone signs up as a User with one login; roles are optional profiles linked later
2. **Browse without roles** — new users can search stables, trainers, vets, horses before creating any role
3. **Personal profile required** before creating provider role profiles (stable, trainer, etc.)
4. **Relationships require acceptance** by the receptor
5. **Live chat is open** between users (WhatsApp-style), independent of relationship status
6. **Operational data** (records, invoices tied to workflows) requires **accepted** horse relationship
7. **Established relationships are permanent** — history and owner read access (their horses only) remain after service ends or dispute; declined pending requests may be resent
8. **Collaborators are Users** — profile owner invites a User to collaborate at a **role profile** (e.g. stable) via `WorkplaceRelationship`; may collaborate at multiple profiles
9. **Reviews are horse-scoped** and only allowed on verified established horse ↔ provider relationships
10. **Invitations include referral reference number** — first reference used at owner signup wins attribution
11. **Horse discovery is per horse** — `profileVisibility` and `contactDisplay` on each `Horse`; user profile exposure is controlled by `User.preferences` (see [`userModule.md`](userModule.md))
12. **Invitation policy (anti-spam)** — see [`userModule.md`](userModule.md) §6: horse owners invite any provider type; host entities invite services only; services never initiate

---

## Flow 1 — Horse owner (primary payer)

### 1.1 Signup and setup

```
Sign up (email/password or auth provider)
  → Browse app (search stables, trainers, vets, horses — no role required)
  → Complete personal profile when ready
  → Add first horse profile (sets mainOwnerUserId on Horse; per-horse visibility/contact defaults apply)
  → Start 30-day trial for that horse
```

### 1.2 Connect stable

```
Owner opens horse profile (after offline agreement if needed)
  → Search stable in platform
      → If found: owner sends invitation (horse ↔ stable)
      → If not found: add stable name + email → pending `Relationship` + invitation email with reference code
  → Stable operator receives notification
  → Stable accepts or declines (may resend after owner/stable chat if declined by mistake)
  → If accepted: permanent horse ↔ stable relationship; shared ops unlock; owner sees only their horse data
```

**Only the horse owner initiates** horse hosting invites — stables do not request horses on the platform.

### 1.3 Connect trainer, vet, groom, and other providers

Same pattern as stable — **owner invites** from the horse hub:
- Search provider → send invitation
- Or invite by email with reference code (user-linked types)

### 1.4 Daily owner usage

```
Open owner dashboard
  → Select horse
  → View timeline (updates, invoices, bookings, documents)
  → Chat with any user (open chat)
  → Request booking with linked stable/trainer
  → Leave horse-scoped review after verified relationship activity
```

### 1.5 Subscription

```
Trial active (30 days)
  → Trial ending notifications
  → Main owner billed $99/month per horse
  → Co-owners remain linked but do not become payer unless ownership transfer occurs
```

**Stable, riding club, transport, and breeder partnerships** use the same `mainOwnerUserId` + `coOwners[]` embed as horses (shared `coOwnerSchema`). Co-owners receive full profile-owner access; adding co-owners via API is future work.

---

## Flow 2 — Stable owner / manager

### 2.1 Signup and setup

```
Sign up
  → Create personal profile
  → Create Stable business account (name, location, services, photos)
  → Configure availability/services (basic)
```

### 2.2 Hosted horses

Horses appear on the stable roster only after the **horse owner** sends and the stable **accepts** a horse ↔ stable `Relationship`. The stable does not initiate horse hosting invites.

```
Horse owner invites stable from horse profile
  → Stable operator accepts or declines
  → If accepted: horse on stable roster; shared ops unlock for that horse
```

If the horse or owner is not on the platform, the **horse owner** (or their delegate) adds the horse and invites the stable — not the reverse.

### 2.3 Operations

```
Stable dashboard
  → Horse roster
  → Post care/update note on linked horse
  → Create invoice for owner
  → Respond to booking requests
  → Chat with owners/users (open chat)
```

### 2.4 Stable collaboration invitation

Collaborators are **never owned by a stable profile**. Every groom, rider, or manager is a **User** (same signup as everyone). The **profile owner** (User who owns the `Stable` role profile) or admin sends a **collaboration invitation** to **service Users** (trainer, vet, groom, farrier, coach, rider) — not to horses or other host entities.

See [`workplaceRelationship.md`](workplaceRelationship.md) for barn staff access on hosted horses.

```
Profile owner (User) or admin on that stable profile invites User by email
      → If email exists: user sees pending invite on GET /users/me/workplaces
      → If email not registered: invite stored; user signs up → invite linked
  → User accepts or declines (only the User decides)
  → On accept: WorkplaceRelationship active (User ↔ stable role profile); id on Stable.collaborators[]
  → Profile owner sets hierarchy on that collaboration (admin | manager | staff)
  → Stable assigns activities/jobs within permissions on that link
```

**Multi-stable:** the same User may accept collaboration invitations from **multiple stable profiles**.

Example: User who owns a vet profile invited as `manager` at someone else's stable — vet profile unchanged; access only via collaboration at that stable profile.

### 2.5 Growth / commission

```
Invite owners to join for horse visibility
  → Owner signs up using stable reference
  → Owner converts to paid horse subscription
  → Stable earns 10% commission for first 12 paid months (if active business threshold met)
```

---

## Flow 3 — Trainer

### 3.1 Signup and setup

```
Sign up
  → Create personal profile
  → Create Trainer account (specialty, bio, service area)
```

### 3.2 Connect to horses

Same two-path relationship model:
- Request existing horse (owner accepts)
- Invite owner/horse via email if not registered

### 3.3 Operations

```
Trainer dashboard
  → Linked horses list
  → Create training session / note (text, photo, video)
  → Propose training booking
  → Issue training invoice (Phase 1B polish)
  → Chat with owners (open chat)
```

---

## Flow 4 — Veterinarian (required before production launch)

Documented for continuity. Not required for Phase 1A wedge pilots; **required** for public production (`mvpScope.md`). Spec: `businessPlan.md` Section 10.3 Vet module.

```
Sign up
  → Create personal profile
  → Create Vet business account
  → Add/search horse (or receive owner invitation)
  → Owner accepts relationship (typically after prior chat)
  → Vet writes medical records (only vet can write medical data)
  → Owner views horse-scoped health timeline on their horse only
  → Horse-scoped review available after verified established relationship
```

---

## Flow 5 — Transport operator

```
Sign up
  → Create personal profile
  → POST /api/v1/transports (create transport company; user may create multiple)
  → Link horse move request or invite owner/horse (horse ↔ transport Relationship — see Flow 6)
  → Owner accepts
  → [Roadmap] Create transport booking + trip status updates
  → [Roadmap] Transport invoice visible to owner
```

Baseline today: company create + discovery visibility (`isPublic`, `acceptsNewBookings`) + public card read. Booking, trips, and invoicing are deferred (see businessPlan §4.10).

---

## Flow 6 — Horse relationship invitation

Applies when a **horse owner** links a horse to any provider profile (stable, vet, trainer, groom, transport, etc.).

```
Horse owner initiates invite (after offline agreement if needed)
  → Provider notification (push + email)
  → Provider accepts OR declines — providers never initiate horse links
  → Accepted: permanent `Relationship` record + operational permissions
  → Declined: owner may send again after chat; no operational data
```

### If invitee is not registered

```
Owner enters minimal profile data + email
  → Create pending Relationship (invitedName, invitedEmail, referralReference)
  → Invitation email with referral reference
  → Invitee signs up
  → On accept: receiverAccountId set on Relationship; operational access unlocks
```

---

## Flow 7 — User collaborates at a stable profile

Applies when a **User** works at another User’s **stable role profile**. Both parties are people with one login each. Pattern: workplace invitation → invited User accepts → relationship document.

See [`workplaceRelationship.md`](workplaceRelationship.md).

```
User signs up or already has account (may also own horses, vet profile, trainer/rider profile, own stable, etc.)
  → Profile owner (or admin on that stable profile) sends collaboration invitation
  → Invited User accepts or declines
  → On accept: WorkplaceRelationship (User ↔ Stable profile id); id on Stable.collaborators[]
  → Hierarchy (admin | manager | staff) on collaboration document
  → Work assigned per permissions on that link
  → Same User may accept invites at other stable profiles
```

Permissions live on the **WorkplaceRelationship**, not on the User — see `userModule.md` and `workplaceRelationship.md`.

### Barn staff examples

**Groom at barn:** Alice owns Sunrise Stable. Bob accepts stable hosting for Comet. Alice invites Carla (groom subsection). Carla accepts collaboration. Carla logs feed/care on Comet without a separate groom↔Comet `Relationship`.

**Vet at owner's home:** Bob invites Dr. Lee's veterinary profile to Comet. Bob accepts. Dr. Lee writes health records. Stable not required.

---

## Flow 8 — Booking request

```
Requester selects provider + horse + proposed time/service
  → Provider receives instant notification
  → Provider accepts or declines
  → If accepted: event appears on owner + provider calendars and horse timeline
  → If declined: requester notified and can propose new slot
  → Coordination can continue in open live chat with booking context attached
```

---

## Flow 9 — Review submission (horse-scoped, bidirectional)

```
Party A attempts review on Party B
  → System checks verified relationship for specific horse (accepted or ended)
  → System checks Party A is an authorized actor for their side (owner for horse, profile operator for entity)
  → If valid: review form opens (category ratings + optional text)
  → Review stored against horse ↔ relationship context (reviewer → reviewee)
  → If invalid: review blocked
```

**Bidirectional rule:** once connected by an accepted horse `Relationship`, either side may review the other in that same horse context — e.g. stable reviews horse, owner reviews stable, vet reviews stable, vet reviews horse (via owner), transport reviews owner/stable, etc.

**Horse operator:** the horse does not log in; owner/co-owner submits or receives horse-side reviews.

Examples:
- Owner has Horse 1 (Vet A) and Horse 2 (Vet B)
- Owner reviews Vet A only in Horse 1 ↔ Vet A context; Stable S may review Horse 1 only in Horse 1 ↔ Stable S context
- Vet A may review Stable S only when both have Horse 1 relationships and the review stays horse-scoped

---

## Flow 10 — Horse ownership transfer

```
Main owner initiates transfer
  → Select new main owner user
  → Confirm transfer
  → Billing responsibility moves to new main owner
  → Horse history and records remain intact
  → Relationship permissions re-evaluated under new owner context
```

---

## Flow 11 — Relationship end / rejection

```
Relationship rejected or ended
  → Active operational access removed
  → Historical records remain with static reference (“hard coded” historical link)
  → Reviews previously submitted remain in historical horse-provider context per policy
```

---

## MVP flow priority (Phase 1A)

Must ship:
1. Owner signup → add horse → invite stable/trainer
2. Stable signup → add/invite horse → accept requests
3. Trainer signup → link horse → post session update
4. Relationship accept/decline
5. Open chat
6. Booking request accept/decline
7. Basic invoice visibility for owner

Can defer to Phase 1B:
- Commission dashboard for businesses
- Advanced document organization
- Media-rich trainer logging polish
