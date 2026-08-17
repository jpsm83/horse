# Product Flows — Onboarding and Core Journeys

Journeys for identity, relationships, billing, and day-one work.

Sources: [`graph-and-identity.md`](graph-and-identity.md), [`monetization.md`](monetization.md), [`mvpScope.md`](mvpScope.md), `equus/docs/engineering/stack.md`.

---

## Technical mapping

| Flow step | Backend |
|-----------|---------|
| Signup / login | Auth.js (web) or `POST /api/v1/auth/*` (mobile) |
| Create horse / stable / later modules | REST + Zod + `lib/services` |
| Horse ↔ provider | `POST /api/v1/relationships` — **owner or hosting stable** may initiate (see Flow 6) |
| Accept / decline | `PATCH /api/v1/relationships/:id` |
| Staff invite | Host entity invites **Users** — `workplaceRelationship.md` |
| Chat | REST messages (1A); Socket.io when realtime ships |
| Uploads | Cloudinary |
| Reviews | `Rating` on `relationshipId` + `horseId`; bidirectional |
| Entity billing | Subscription on **Stable** (later other entities); customer = owning User |

Provider links are **not** denormalized as the only source of truth on `Horse` — query accepted `Relationship` by `horseId`.

---

## Global rules

1. **User first** — one login; roles optional  
2. **Browse without roles** — search **horses and stables** (and later other **entity** types). **Never search users**  
3. Personal profile required before creating a **paid** entity (stable)  
4. Relationships need **accept**  
5. **Chat is open** (WhatsApp-style)  
6. Ops data needs **accepted** horse relationship  
7. Accepted relationships are **permanent** (`ended` keeps history)  
8. Collaborators are **Users** via `WorkplaceRelationship`  
9. Reviews are **horse-scoped**  
10. **No** owner-subscription referral commission  
11. Per-horse `profileVisibility` / `contactDisplay`  
12. **Favorites** are private shortcuts, not relationships  
13. Live stable data in owner Hub only if the **stable is in good standing**  
14. Home is **My Graph**

---

## Flow 1 — Horse owner (not an Equus payer)

### 1.1 Signup

```
Sign up (email/password or provider)
  → Browse horses/stables
  → Complete personal profile
  → Add horse(s) — unlimited, free — or claim a waiting-transfer horse from email
  → Land on My Graph
```

No horse trial. No Equus card.

### 1.2 Connect a stable (owner has the horse)

```
Owner on horse Hub
  → Search stables
      → Found: send horse ↔ stable invite
      → Not found: name + email → pending Relationship + invite email
  → Stable accepts or declines
  → Accepted: host relationship; portal live if stable in good standing
```

### 1.3 Daily

```
My Graph → horse
  → Hub (social) always
  → Portal slice (logs, invoices, schedule, docs) if stable in good standing
  → Chat, favorites, booking with linked stable
  → Horse-scoped review when relationship exists
```

### 1.4 If the stable lapses

Social Hub + chat remain. **Live** stable slice hides (or last snapshot if we ship that). The owner does not pay to restore it — the **stable** must pay.

---

## Flow 2 — Stable operator (Equus customer)

### 2.1 Signup and SaaS

```
Sign up → personal profile → create Stable
  → Location sets currency (Spain → EUR)
  → 30 days full SaaS free (good standing)
  → Catalog shown (1–5 €49 … 61+ €4/horse floor €299); price stored on entity (overridable)
  → After 30 days: pay or enter 7-day grace then write-lock
```

### 2.2 Hosted horses — two paths

**A. Owner invites** (Flow 1.2): stable accepts → horse on roster.

**B. Stable already has the horse:**

```
Stable creates horse (owner email required)
  → mainOwner = stable’s owning user
  → waiting-transfer flag
  → Email owner: sign up and take ownership
  → Daily nag forever to stable user + owner until claim
  → Horse counts on roster
  → On claim: owner = mainOwner; stable = host Relationship
```

### 2.3 Operations

```
Stable module (if not write-locked)
  → Roster, tasks, invoices, bookings, docs
  → Chat
  → Invite Users as collaborators
```

### 2.4 Collaboration

Unchanged pattern: profile owner invites User by email → User accepts → `WorkplaceRelationship` + hierarchy. Multi-stable OK. See `workplaceRelationship.md`.

### 2.5 Promos

Ops may attach free days / % off / complimentary periods on **this** entity at any time ([`monetization.md`](monetization.md)).

---

## Flow 3 — Trainer (launch: User + collab, not a paid module)

```
Sign up → profile
  → Optional: collaborate at a stable (workplace invite)
  → Horse links to a Trainer **profile/module** are post-launch
```

Do not require a trainer SaaS subscription at launch.

---

## Flow 4 — Veterinarian (post-launch module)

Not required for production. When built: same entity-pays pattern as stable; owner invites or (if product allows) practice creates with waiting-transfer — reuse graph rules.

Until then: vet is a User; may collaborate at a stable; owner may chat with them.

---

## Flow 5 — Transport (deferred module)

Identity/discovery may exist; deep ops deferred. Same graph + later entity billing.

---

## Flow 6 — Horse relationship invitation

**Initiator:** horse **owner** (any provider) **or** **hosting stable** creating/claiming a boarded horse (Path B). Other provider types **do not** create horses at launch.

```
Invite sent → other party notified
  → Accept: permanent Relationship + ops permissions
  → Decline: no ops; may resend
```

Unregistered invitee: pending Relationship + email; on signup they accept.

---

## Flow 7 — User collaborates at a stable

Same as before. See `workplaceRelationship.md`.

Stable staff example: Alice owns Sunrise; Comet hosted; Carla accepts collab; Carla logs care on Comet without a groom↔Comet `Relationship`.

---

## Flow 8 — Booking

```
Requester: provider + horse + slot
  → Accept / decline
  → Calendars + horse timeline
  → Chat may carry booking context
```

---

## Flow 9 — Review (horse-scoped, bidirectional)

Unchanged: verified `horseId` + `relationshipId`; either side; owner operates horse side.

---

## Flow 10–12 — Ownership transfer

`transfer_main` / `remove_co_owner` / `promote_co_owner` as in `ownershipTransfer.md`.

**Horse `transfer_main`:** used for sale **and** for **claiming** a waiting-transfer horse (owner takes over from stable user).

**Stable `transfer_main`:** SaaS customer becomes the new stable `mainOwner`.

Horse history stays on the horse. Entity SaaS billing does **not** follow horse `mainOwner`.

---

## Flow 13 — Relationship end / rejection

```
Rejected: no ops
Ended: writes stop; history + horse-scoped reviews remain
```

---

## Flow 14 — Entity subscription lapse

```
30-day free or paid/promo ends, no payment
  → 7 days: ops live, reminders to entity owner
  → Then: write-lock; read-only history; public page + chat stay
  → Owner Hubs lose live portal for that stable
  → Payment restores writes + live portal
```

---

## MVP flow priority (Phase 1A)

Must ship:

1. Owner signup → horse → invite stable  
2. Stable signup → 30-day SaaS → accept horse **or** create waiting-transfer horse  
3. Owner claim of waiting-transfer  
4. Chat, favorites, My Graph  
5. Booking + basic invoices  
6. Collaborator invite  

Defer to 1B: live Stripe, promo admin, lapse write-lock polish, metrics admin.
