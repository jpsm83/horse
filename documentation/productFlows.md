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
| Create horse / stable / trainer | REST API + Zod validation + `lib/services` |
| Relationship request / invite | `Relationship` collection (`invitedEmail` when provider not registered) |
| Accept / decline | `PATCH /api/v1/relationships/:id` |
| Chat | REST messages (1A); Socket.io when realtime ships |
| Uploads | Cloudinary via API route |
| Reviews | `Rating` tied to `relationshipId` + `horseId` |

Provider links (vet, stable, trainer, etc.) are **not** stored on `Horse` directly — query accepted `Relationship` documents by `horseId`.

---

## Global rules (all roles)

1. **User first** — everyone signs up as a User, then creates domain account types
2. **Personal profile required** before creating business/horse accounts
3. **Relationships require acceptance** by the receptor
4. **Live chat is open** between users (WhatsApp-style), independent of relationship status
5. **Operational data** (records, invoices tied to workflows) requires accepted horse relationship
6. **Reviews are horse-scoped** and only allowed on verified horse ↔ provider relationships
7. **Invitations include referral reference number** — first reference used at owner signup wins attribution

---

## Flow 1 — Horse owner (primary payer)

### 1.1 Signup and setup

```
Sign up (email/password or auth provider)
  → Create personal profile (owner preferences optional)
  → Add first horse profile (sets mainOwnerUserId on Horse)
  → Start 30-day trial for that horse
```

### 1.2 Connect stable

```
Owner opens horse profile
  → Search stable in platform
      → If found: send relationship request (horse ↔ stable)
      → If not found: add stable name + email → pending `Relationship` + invitation email with reference code
  → Stable receives notification
  → Stable accepts or declines
  → If accepted: stable appears on horse relationships + shared ops unlock
```

### 1.3 Connect trainer

Same pattern as stable:
- Search trainer → request
- Or invite by email with reference code

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

---

## Flow 2 — Stable owner / manager

### 2.1 Signup and setup

```
Sign up
  → Create personal profile
  → Create Stable business account (name, location, services, photos)
  → Configure availability/services (basic)
```

### 2.2 Add horses

**Path A — horse exists**
```
Search horse
  → Send relationship request to horse owner
  → Owner accepts/declines
```

**Path B — horse not on platform**
```
Add horse basics + owner email
  → Invitation sent to owner (with reference code)
  → Owner signs up and accepts relationship
```

### 2.3 Operations

```
Stable dashboard
  → Horse roster
  → Post care/update note on linked horse
  → Create invoice for owner
  → Respond to booking requests
  → Chat with owners/users (open chat)
```

### 2.4 Growth / commission

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

## Flow 4 — Veterinarian (Phase 2 prep, not MVP)

Documented for continuity; not in Phase 1A build.

```
Sign up
  → Create personal profile
  → Create Vet business account
  → Add/search horse
  → Owner accepts relationship
  → Vet writes medical records (only vet can write medical data)
  → Owner views horse-scoped health timeline
```

---

## Flow 5 — Transport operator (post-MVP expansion)

```
Sign up
  → Create personal profile
  → Create Transport business account
  → Link horse move request or invite owner/horse
  → Owner accepts
  → Create transport booking + trip status updates
  → Transport invoice visible to owner
```

---

## Flow 6 — Relationship request (generic)

Applies to all provider ↔ horse ↔ owner combinations.

```
Requester initiates link
  → Receiver notification (push + email)
  → Receiver accepts OR declines
  → Accepted: active bidirectional relationship + operational permissions
  → Declined: requester notified, no active link, no shared operational data
```

### If invitee is not registered

```
Requester enters minimal profile data + email
  → Create pending Relationship (invitedName, invitedEmail, referralReference)
  → Invitation email with referral reference
  → Invitee signs up
  → On accept: receiverAccountId set on Relationship; operational access unlocks
```

---

## Flow 7 — Booking request

```
Requester selects provider + horse + proposed time/service
  → Provider receives instant notification
  → Provider accepts or declines
  → If accepted: event appears on owner + provider calendars and horse timeline
  → If declined: requester notified and can propose new slot
  → Coordination can continue in open live chat with booking context attached
```

---

## Flow 8 — Review submission (horse-scoped)

```
User attempts review on provider
  → System checks verified relationship for specific horse
  → If valid: review form opens (category ratings + optional text)
  → Review stored against horse ↔ provider pair
  → If invalid: review blocked
```

Example:
- Owner has Horse 1 (Vet A) and Horse 2 (Vet B)
- Review for Vet A must be tied to Horse 1 context only

---

## Flow 9 — Horse ownership transfer

```
Main owner initiates transfer
  → Select new main owner user
  → Confirm transfer
  → Billing responsibility moves to new main owner
  → Horse history and records remain intact
  → Relationship permissions re-evaluated under new owner context
```

---

## Flow 10 — Relationship end / rejection

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
