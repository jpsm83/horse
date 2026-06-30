# Horse Ecosystem App — Business Plan

This document is the working business plan for the app we will build. It starts with the core product vision and will be expanded over time with strategy, phases, monetization, and go-to-market details.

## How To Read This File

- **Section 0**: survival strategy and Phase 1 wedge
- **Section 1–7**: product vision, users, entities, relationships, shared features, trust rules
- **Section 8**: remaining open items (post-plan follow-ups)
- **Section 9–10**: product summary, account architecture, domain feature modules
- **Section 11**: monetization model
- **Section 12**: long-term platform capabilities (buy/sell, notifications)
- **Section 13**: horse data dictionary (long-term scope)
- **Section 14**: relationship requests, invitations, and organic growth loop
- **Section 15**: interaction policy (utility-first social layer)
- **Section 16**: booking, scheduling, and real-time communication
- **Section 17**: trust and performance badge policy
- **Section 18**: phased execution plan (phase 1 -> phase 12)
- **Section 19**: partner revenue share program (business referral commissions)
- **Section 20**: competitive positioning (stable-centric tools, e.g. EquineM)

Related context:
- `stack.md` — canonical technical stack (Next.js, REST API, MongoDB, Auth.js, shadcn, Zod)
- `mvpScope.md` — build phases, production launch gate, and exclusions
- `stableModule.md` — stable feature specification (living doc; EquineM parity + more)
- `workplaceRelationship.md` — User ↔ role profile workplace relationship (no separate business account)
- `equinem.md` — competitor capability reference (EquineM)
- `validationPlaybook.md` — pre-build interview script and scoring
- `productFlows.md` — onboarding and core user journeys
- `metricsSpec.md` — internal business metrics definitions
- `README.md` — documentation index

---

## Section 0 — Survival Strategy And Phase 1 Focus

This business plan covers the full long-term horse ecosystem vision.  
Execution will be phased and focused.

### 0.1 Strategic rule

- Full solution is the destination
- Focused wedge is how we survive and win early

We will not build everything at once. We will first solve one painful workflow deeply enough to become indispensable.

### 0.2 Early-stage objective

Become the reference platform by owning the daily operational workflow between:

- Horse owners
- Stables
- Trainers
- Breeders
- Groomers
- Coachs
- Farriers
- Riders
- Racing clubs
- Transports
- Users
- Veterinaries

This is the highest-movement part of the ecosystem and creates natural product distribution.

### 0.3 Phase 1 value proposition (owner-first)

From day one, the app should make horse ownership clearer and easier by delivering:

1. **Expense clarity** — owner sees horse costs in one place
2. **Communication centralization** — replace fragmented WhatsApp/chat flows
3. **Horse account visibility and control** — timeline, relations, status, key data
4. **Paperwork simplification** — documents, invoices, schedules, and records in one platform

### 0.4 Phase 1 focus users (go-to-market wedge)

Primary launch focus:

- Stables
- Trainers
- Horse owners
- Groomers
- Coachs
- Farriers
- Riders
- Users
- Veterinaries

Why this wedge:

- Stables generate frequent horse activity
- Trainers, Groomers, Coachs, Farriers, Riders, Users and Vets usualy works with the Stables
- They already manage spreadsheets, invoices, schedules, and messaging
- Free business usage helps adoption
- They naturally promote the app to owners they already work with

### 0.5 Phase 1 operating scope

Phase 1A/1B are **incremental build milestones** (`mvpScope.md`).  
**Public production** requires Trainers, Groomers, Coachs, Farriers, Riders, Users, Veterinaries, Horse, and Stable modules fully implemented — not Phase 1 alone.

Stable capabilities: [`stableModule.md`](stableModule.md).

### 0.6 Planned expansion after wedge success

Post-wedge expansion sequence (breeders deth, riding club deth, transport depth, marketplace last) is defined in **Section 18** and entity modules in **Sections 4 and 10**.

### 0.7 Success condition for early survival

Early success is not measured by total feature count.  
It is measured by becoming operationally indispensable inside one niche workflow first, then scaling into the full connected horse-industry solution.

---

## Section 1 — Product Vision

### One-line pitch

A complete connected platform for the horse world — where owners, horses, stables, trainers, vets, riding clubs, and service providers all have their own profiles, are linked to each other, and can be discovered, reviewed, and managed in one place.

### The problem we are solving

Horse-related information today is fragmented:

- Businesses are found through word of mouth, Facebook groups, and WhatsApp
- Horse history (health, stables, owners, competitions) lives in spreadsheets, PDFs, and private chats
- There is no single trusted place where a horse, a stable, a vet, and an owner are all connected with shared context
- Reviews and reputation are informal, political, and hard to verify

### What we are building

Not just a directory. Not just a stable management tool. Not just a marketplace.

We are building a **connected horse ecosystem** where every important element in the horse world has its own account, its own page, its own history, and clear relationships to everything else it touches.

---

## Section 2 — Target Users

The platform serves the full horse industry, starting with discovery and profiles, and growing into deeper operational features over time.

| User type | Role on the platform |
|-----------|----------------------|
| **Horse owners** | Find services, manage horses, follow history, communicate with related accounts |
| **Stables** | Business profile, offerings, boarding, horses currently and previously hosted |
| **Trainers** | Profile, specialties, horses trained, reputation |
| **Riding clubs** | Club profile, members, events, facilities |
| **Breeders** | Breeding stock, bloodlines, sales, reputation |
| **Veterinarians** | Practice profile, horses treated, specializations |
| **Farriers** | Hoof care specialists, recurring service relationships |
| **Transport companies** | Horse transport services and history |
| **Physiotherapists / rehab centers** | Specialized care and treatment history |
| **Insurance providers** | (future) policies linked to horses and owners |
| **Competition coaches** | Training and competition preparation |

More entity types can be added as the ecosystem grows. The core principle stays the same: **every element gets an account and can be related to others.**

---

## Section 3 — Core Concept: Everything Connected

The central idea of this app is **relationship-first design**.

Every profile is not isolated. Each entity exists inside a network:

```
Owner
  └── owns → Horse
                ├── stays at → Stable
                ├── trained by → Trainer
                ├── treated by → Vet
                ├── shod by → Farrier
                ├── transported by → Transport company
                ├── registered at → Riding club
                ├── bred by → Breeder
                └── co-owned by → Users (syndicate members via ownership %)

Stable
  ├── hosts → Horses (current and past) via horse Relationship
  ├── collaborates with → Users (groom, rider, vet at barn via WorkplaceRelationship)
  └── reviews ↔ Horses / owners / providers (bidirectional, horse-scoped — only when related)

Vet
  ├── treated → Horses
  └── reviews ↔ Horses / owners / stables / other related providers (bidirectional, horse-scoped)
```

### Design principles

1. **Every entity has its own account and public (or semi-public) page**
2. **Relationships are explicit** — a horse is linked to the stables it visited, the vets who treated it, its owners, etc.
3. **History is preserved** — past stables, past vets, past trainers remain part of the horse's record
4. **Discovery is built in** — owners can find trainers, stables, riding clubs, breeders, and more from one platform
5. **Trust is earned through verified, horse-scoped reviews** — bidirectional between connected parties, not open anonymous ratings

---

## Section 4 — Entity Types And Account Features

### 4.1 Horse account

Each horse is a first-class entity with its own profile. Full operational scope is defined in [`horseModule.md`](horseModule.md) (profile, ownership, discovery, relationships, timeline, health, documents, subscription).

**Profile details:**
- Name, breed, age, sex, color, type/discipline
- Photos and videos
- Bloodline / pedigree (where applicable)
- Current and past owners (with ownership % for syndicates)
- Estimated value / price (optional, visibility-controlled)
- Competition history and results
- Documents (passport, insurance, certificates)

**Relationships:**
- Owners (current and historical)
- Stables visited (current and past)
- Trainers (current and past)
- Vets who treated the horse
- Farriers, physiotherapists, transport companies
- Breeders (if applicable)
- Riding clubs / competition registrations

**Activity:**
- Health events (vaccinations, injuries, treatments)
- Training updates from trainers
- Stable stay records (check-in / check-out)
- Competition entries and results

---

### 4.2 Stable account

Each stable operates as a business on the platform.

**Business profile:**
- Name, location, photos, facilities
- Description and specialties (jumping, dressage, racing, breeding, rehabilitation, etc.)
- Services offered (boarding, training, lessons, rehab, etc.)
- Pricing tiers and availability (renting / boarding slots)
- Contact and inquiry system
- Trust verification status + earned performance badges

**Relationships:**
- Horses currently and previously hosted
- Trainers associated with the stable
- Owners of hosted horses
- Reviews from verified, horse-scoped relationships only

**Operations:**
- Full operational scope is defined in [`stableModule.md`](stableModule.md) (activity planning, roster, feed, facilities, finance, team, owner transparency)
- Horse-centric owner features (timeline, discovery, subscription) are defined in [`horseModule.md`](horseModule.md)
- Stall assignments, feeding and training schedules, invoicing, and owner communication portal are in scope before public production launch

---

### 4.3 Trainer account

**Profile details:**
- Name, photo, bio
- Specialties and disciplines (jumping, dressage, eventing, racing, etc.)
- Experience, certifications, competition results
- Location and service area
- Rates and availability

**Relationships:**
- Horses trained (current and past)
- Stables they work with
- Owners they work with
- Reviews from verified, horse-scoped relationships

---

### 4.4 Veterinarian account

**Baseline discovery API (shipped):** `POST /api/v1/veterinaries`, discovery PATCH, and public card GET — see [`equus/documentation/veterinaries.md`](../equus/documentation/veterinaries.md). Full clinical module (treatment records, scheduling, attachments) remains in §10.3.

**Profile details:**
- Practice name, location, contact
- Equine specializations
- Emergency availability
- Certifications and credentials

**Relationships:**
- Horses treated (with owner consent / privacy controls)
- Stables they serve
- Treatment history linked to horse profiles

**Reviews:**
- Only from owners or stables with a verified, horse-scoped treatment relationship

---

### 4.5 Breeder account (entity-owned)

**Ownership:** `Breeder.mainOwnerUserId` (+ optional `coOwners[]`). One User may operate **multiple** breeding operations. Not stored on `User.breederProfileId` (removed).

**Profile details:**
- Breeding operation details
- Bloodlines and stock
- Available horses / foals
- Breeding contracts and history

**Relationships:**
- Horses bred
- Owners who purchased from them
- Reviews from verified, horse-scoped buyers

---

### 4.6 Riding club account

**Profile details:**
- Club name, location, facilities
- Membership info
- Events and competitions hosted
- Disciplines supported

**Relationships:**
- Member horses and owners
- Competition history
- Reviews from verified, horse-scoped members

---

### 4.8 Horses (entity-owned)

There is no `Owner` model or `User.*ProfileId` for horses. A user operates horses when they create or own them (`Horse.mainOwnerUserId`). **Syndicates** are modeled on the horse: `Horse.coOwners[]` lists each co-owner `User` with an ownership percentage (and optional billing responsibility).

**Profile details:**
- Name, photo, location
- Horses owned (current and past)
- Public profile visibility settings

**Relationships:**
- Their horses
- Stables, trainers, vets they work with
- Riding clubs they belong to

**Capabilities:**
- Discover and search for services
- Request services from businesses
- View horse history and updates
- Leave reviews on verified, horse-scoped relationships

---

### 4.10 Transport provider account (entity-owned)

**Ownership:** `Transport.mainOwnerUserId` (+ optional `coOwners[]`). One User may operate **multiple** transport companies. Not stored on `User.*ProfileId`.

**Baseline API (shipped):** `POST /api/v1/transports`, `PATCH /api/v1/transports/:id/discovery`, `GET /api/v1/transports/:id` — see [`equus/documentation/transports.md`](../equus/documentation/transports.md).

Each transport company operates as a business account on the platform.

**Business profile:**
- Company name, location, contact
- Service areas and coverage routes
- Fleet/capacity details (where applicable)
- Transport specialties (local, long-distance, competition transport, emergency)
- Rates, availability, and booking preferences
- Trust verification status + earned performance badges

**Relationships:**
- Horses transported (current and historical)
- Owners and stables requesting transport
- Move events linked to horse history (origin, destination, dates)
- Reviews from verified, horse-scoped transport relationships only

**Operations (roadmap — not baseline):**
- Transport booking requests and schedule management
- Trip status updates and communication with owner/stable
- Transport invoices and payment visibility
- Horse relocation timeline entries on horse profile

**Roadmap note:**
- Transport is a first-class entity/module in the plan; deep transport operations can be phased after core wedge traction (see Section 18, Phase 12).

---

### 4.11 Other service providers (future expansion)

These follow the same pattern — own account, own page, linked relationships:

- Farriers
- Physiotherapists / rehabilitation centers
- Competition coaches
- Insurance providers

---

## Section 5 — Relationships And Data Model (Conceptual)

### Relationship types

| From | To | Relationship |
|------|----|--------------|
| Owner | Horse | owns (with % for syndicates) |
| Horse | Stable | boarded at (current / past) |
| Horse | Trainer | trained by (current / past) |
| Horse | Vet | treated by |
| Horse | Breeder | bred by |
| Horse | Riding club | member of |
| Horse | Transport | transported by (current / past) |
| Stable | Trainer | employs / partners with |
| Owner | Stable | customer of |
| Owner | Trainer | client of |
| Owner | Vet | client of |
| Owner | Transport | client of |

### Relationship rules

- A relationship must be **created or confirmed** — not assumed
- **Pending or declined** requests create no operational connection; the requester may send again (e.g. after a mistaken decline)
- **Established (accepted) relationships are permanent** — the record is never deleted. When a horse leaves a stable or a dispute occurs, the relationship may move to an `ended` status, but historical data, owner read access to **their horse's** records from that period, and horse-scoped review rights remain
- Owners access **only their own horses'** data — never other clients' horses at the same stable
- Stables join the platform on a **transparency** expectation: operational data for linked horses is owner-visible per role and scope rules
- Some fields remain **private by default** (e.g. vet clinical detail scope) with visibility controlled by the owner and module policy
- Only accounts with a **verified established relationship** (active or ended) can leave horse-scoped reviews for that horse-provider pair
- Operational write access follows active hosting/service rules; live chat is open between users before acceptance (see Section 15)
- **Two link types:** horse `Relationship` (horse ↔ provider) and `WorkplaceRelationship` (User ↔ stable profile collaboration). See [`workplaceRelationship.md`](workplaceRelationship.md)
- **Barn staff:** a collaborator may write on a hosted horse when active collaboration at the stable **and** accepted horse ↔ stable `Relationship` exist — no separate groom↔horse link required
- **Direct path:** owner may accept horse ↔ provider `Relationship` without stable (e.g. vet at owner's home)

---

## Section 6 — Shared Platform Features

These features apply across entity types, with behavior adapted per account type.

### Personal / business page

Every account gets a profile page showing:

- Core details and description
- Photos and media
- Related entities (horses, people, businesses)
- Activity and updates
- Ratings summary (where applicable)

### Discovery and search

Users can find:

- Stables (by location, discipline, services, availability)
- Trainers (by specialty, discipline, ratings)
- Vets (by location, specialization, emergency availability)
- Breeders (by bloodline, stock)
- Riding clubs
- Transport providers (by route, availability, service type)
- Horses (with privacy controls)
- Other service providers

### Ratings and reviews

- Ratings/reviews are tied to **verified horse-specific relationships only** (see Section 7 and Section 15.3)
- **Bidirectional:** once parties share an accepted horse `Relationship`, either side may review the other in that same horse context (e.g. owner reviews stable, stable reviews horse, vet reviews stable, stable reviews vet — all scoped to the linking horse)
- A **horse** never logs in; the horse owner (or co-owner) acts as operator when the horse is the reviewer or reviewee
- **Entity reviewers** (stable, vet, transport, etc.) submit via an authorized operator on that profile (main owner, co-owner, or future staff permission)
- Categories may vary by reviewee type:
  - Stable: communication, horse care, facilities, transparency, professionalism
  - Trainer: communication, horse care, results, professionalism
  - Vet: communication, care quality, availability, professionalism
- Aggregate rating displayed on profile
- No open anonymous reviews

### Live chat and messaging

- Live chat is available between users like a normal WhatsApp-style experience (see Section 15.2)
- Chat is not restricted by horse relationship status
- Reviews remain separate from chat and follow strict relationship rules

### Updates and activity feed

- Trainers post session updates on horses
- Stables post news about their facility
- Vets log treatment summaries (with owner approval)
- Owners see a feed of activity related to their horses

### Documents and media

- Horse documents (passport, insurance, certificates)
- Business documents (contracts, licenses)
- Photos and videos attached to profiles, horses, and updates

---

## Section 7 — Interaction And Trust Rules

Live chat policy is defined in **Section 15**. Booking communication rules are in **Section 16**.

### Reviews — verified, horse-scoped, bidirectional

Reviews (ratings/comments of service quality) are **not open**. They require a verified relationship and are strictly scoped to the horse involved in that relationship. **Either party** connected by that relationship may review the other — direction is not limited to “owner reviews provider.”

Rules:
- Only accounts with a completed or ongoing verified relationship can leave a review
- A review must be tied to a specific **horse + relationship** pair (`horseId` + `relationshipId`)
- **Reviewer and reviewee** are the two sides of that relationship (horse via owner operator, stable, vet, trainer, transport, etc.)
- Reviews are structured (category ratings + optional text), not a free-for-all wall
- Reviewees can respond to reviews received in their profile context
- Disputes handled through platform policy (to be defined)

Strict scoping example:
- User owns Horse 1 (linked to Vet A and Stable S) and Horse 2 (linked to Vet B)
- Owner may review Vet A **only** in Horse 1 ↔ Vet A context; Stable S may review Horse 1 **only** in Horse 1 ↔ Stable S context
- Vet A may review Stable S **only** if Horse 1 has accepted relationships to both and the review is anchored to that horse context (same `relationshipId` horse scope — implementation may use the horse link as shared gate)
- Reviews for Horse 1 cannot be shown or attributed to Horse 2 relationships

This prevents cross-horse review contamination while allowing fair two-way feedback between everyone who worked together on a horse.

### Privacy tiers

- **Public**: business profile, general horse info, competition results
- **Relationship-visible**: health records, treatment history, owner contact
- **Owner-only**: sensitive documents, financial details, private notes

---

## Section 8 — Remaining Open Items

The core business plan is defined. Remaining follow-up work:

- [x] Create `mvpScope.md` with Phase 1A/1B feature boundaries and acceptance criteria
- [x] Expand product flows into a dedicated onboarding/user-journey document (`productFlows.md`)
- [x] Expand internal metrics definitions into a dedicated metrics spec (`metricsSpec.md`)
- [x] Create validation playbook (`validationPlaybook.md`)
- [ ] Define exact active-business threshold for commission eligibility (Section 19)
- [ ] Define commission payout operations (minimum payout, dispute window, refund handling)

Already covered in this document:
- MVP scope and phased roadmap → Section 18 + `mvpScope.md`
- Monetization and partner commissions → Sections 11 and 19
- Validation and GTM → Section 18 (Phases 3 and 4) + `validationPlaybook.md`
- Technical stack → `stack.md` (Next.js REST API, MongoDB, Auth.js, React Native, Cloudinary)
- Product flows → Section 18 (Phase 11) + `productFlows.md`
- Business metrics → Section 18 (Phase 9) + `metricsSpec.md`

---

## Section 9 — Initial Product Summary

Quick reference:
- **Vision and problem** → Section 1
- **Survival wedge and Phase 1 focus** → Section 0
- **Execution sequencing** → Section 18

In one line:
> A connected horse ecosystem with relationship-based trust, owner-paid subscriptions, and free business-driven growth — built in phases, not all at once.

---

## Section 10 — Account Architecture And Domain Feature Modules

This section defines how accounts are created and how each area gets dedicated features while staying connected.

### 10.1 Identity model (critical foundation)

**There is no business account.** Signup and login are always one **User** (one person, one email).

After signup, the same User may add **role profiles** — optional subsections of how they participate on the platform (stable they run, vet practice, trainer/rider profile, horses they own, etc.). Each role profile is its own document (`Stable`, `Veterinary`, `Trainer`, `Horse`, …) linked on the `User`. Navigating to “my stable” or “my horses” is routing within the **same login**, not account switching.

Examples:
- One user can be an **Owner** (via owned horses) and also own a business **Breeder**
- One user can be a **Trainer** and also represent a **Riding Club**
- One user can manage multiple **Horse** profiles and multiple **Stable** role profiles

Core rule:
- **User** = authentication identity (login, permissions, security)
- **Role profiles** = domain profiles (Horse, Vet, Trainer, Stable, Club, Breeder, Racing, Transport, etc.)

Conceptual model:

```
User (root identity; one login per email)
  ├── Horse profile(s) owned or managed (entity-owned via `mainOwnerUserId`)
  ├── Trainer role profile (one per user)
  ├── Veterinary role profile (one per user)
  ├── Coach role profile (one per user)
  ├── Stable role profile(s) (multiple allowed)
  ├── Riding club role profile(s)
  ├── Breeder role profile(s)
  ├── Transport provider role profile(s)
  └── Other provider role profile(s)
```

**Discovery:** user personal profile exposure is controlled by `User.preferences` (`profileVisibility`, `searchable`, `allowDirectMessagesFrom`). Each horse has its own `profileVisibility` and `contactDisplay` (public contact may be the owner or a delegate). See `documentation/userAndRoles.md`.

Why this model matters:
- Supports real-world roles (people wear multiple hats in the horse industry)
- Keeps one secure login with role-based access
- Users browse the app before creating any role; navigation between roles does not require account switching
- Allows scalable permissions per role type and per entity relationship

### 10.2 Product principle: owner has complete horse access

The product experience should guarantee that horse owners can access everything needed for each horse in one place:

- Service relationships
- Health history
- Medication schedules
- Invoices and payments
- Training plans and analytics
- Documents and communications

The owner does not need to collect data from separate apps, chats, and spreadsheets. The platform becomes the single source of truth.

### 10.3 Area modules by account type

Each account type has its own feature module set. Modules are specialized, but connected through shared relationships.

#### Vet module (Vet <-> Horse <-> Owner)

Primary purpose:
- Manage equine care and treatment history linked to horse profiles

Core features:
- Treatment records per horse
- Medication plans and dosage schedules
- Vaccination calendar and reminders
- Visit scheduling and follow-up tasks
- Visit invoices and payment status
- Clinical notes and attachments (lab reports, images, prescriptions)
- Emergency history timeline

Owner-facing value:
- Owner can view medication schedules, treatment history, and vet invoices in one place
- Better continuity when horses change stable or trainer

#### Trainer module (Trainer <-> Horse <-> Owner/Stable)

Primary purpose:
- Manage training workflow and performance progression

Core features:
- Training schedule and session planning
- Session notes (text, photo, video, voice)
- Discipline-specific goals and progress tracking
- Performance analytics dashboard (trends, consistency, outcomes)
- Competition preparation plans
- Attendance/completion tracking
- Trainer billing (session packages, invoices)

Owner-facing value:
- Owner sees what was trained, performance evolution, upcoming training, and costs
- Transparent communication replaces fragmented chat updates

#### Stable module (Stable <-> Horse <-> Owner/Trainer/Vet)

Primary purpose:
- Manage horse hosting operations and owner communication

**Full feature list:** [`stableModule.md`](stableModule.md) — EquineM parity (activity planning, roster, feed, facilities, finance, team, reports) plus ecosystem differentiators (discovery, transparency, horse-scoped reviews, owner dashboard).

Core features (summary):
- Stable profile, services, facilities, and availability
- Horse roster (current and historical)
- Stall/boarding management
- Activity planning, daily care logs (feeding, routines, observations)
- Facility reservations
- Boarding/training invoices and financial administration
- Service requests, owner inquiries, and announcements
- **Collaborators:** Users invited to collaborate at a stable profile via `WorkplaceRelationship`; hierarchy on the link; `Stable.collaborators[]` indexes active collaborations; **multi-stable** allowed — see [`workplaceRelationship.md`](workplaceRelationship.md)

Owner-facing value:
- Owner can track where each horse is, what services are active, current costs, and full operational transparency for their horses only

#### Owner module (Owner <-> All related entities)

Primary purpose:
- Single control center for all horses and related services

Core features:
- Unified dashboard by horse
- Relationship graph (trainers, vets, stables, transport providers, clubs, breeders)
- Timeline of events (health, training, competitions, moves)
- Unified document center
- Unified billing center (all providers)
- Notifications (medication due, invoice due, appointments, competitions)
- Verified review and feedback tools for related providers

Outcome:
- Complete horse management visibility in one account experience

#### Horse module (Horse as first-class entity)

Primary purpose and feature checklist: [`horseModule.md`](horseModule.md).

#### Transport module (Transport <-> Horse <-> Owner/Stable)

Primary purpose:
- Manage horse movement logistics and relocation history

Core features:
- Transport provider profile and service coverage
- Transport booking requests and scheduling
- Trip status updates (requested, accepted, in transit, completed)
- Origin/destination and move timeline on horse profile
- Transport invoices and cost visibility
- Real-time communication during booking and trip coordination

Owner-facing value:
- Owner can track horse moves, transport costs, and provider communication in one timeline

### 10.4 Relationship-driven permissions

All module access should be relationship-aware:

- A vet can only access horses they are linked to (and within granted scope)
- A trainer can only post updates for horses they train
- A stable can only manage horses currently/past hosted per policy
- A transport provider can only manage transport records for linked horses
- Owners can view full records of horses they own/co-own

Permission model dimensions:
- **Role-based** (vet, trainer, stable, owner, etc.)
- **Relationship-based** (is this account linked to this horse?)
- **Scope-based** (read, write, billing, medical, admin)
- **Time-based** (active vs historical relationship permissions)

### 10.5 Cross-module connected workflows

To keep the ecosystem truly connected, key workflows should span modules:

1. **Vet visit workflow**
   - Vet logs treatment -> medication schedule is created -> owner receives reminder -> invoice is issued -> payment tracked

2. **Training workflow**
   - Trainer schedules session -> logs notes and media -> analytics updates -> owner receives progress summary

3. **Horse move workflow**
   - Horse changes stable or location -> stable/transport history updates -> owner dashboard reflects change -> related permissions adjust

4. **Competition workflow**
   - Trainer/club adds event -> horse profile updated -> performance results logged -> owner timeline updated

### 10.6 Feature expansion rule

As new account types are added, each one should follow the same pattern:

1. Dedicated profile and domain module
2. Clear relationships to horse and owner
3. Specialized features for that service area
4. Verified interaction and review model
5. Data exposed in the owner's unified horse dashboard

This keeps the platform extensible without losing focus.

---

## Section 11 — Monetization Model (Simple And Clear)

This monetization model is intentionally straightforward:

- **Horse owner pays per horse (monthly fee)**
- **Business account types use the app for free**
- **Pricing is tied to horse ownership, not profession**

### 11.1 Core billing rule

If a user account has horses under ownership, billing is:

`monthly amount = number of owned horses x fee per horse`

Examples:
- Owner with 1 horse -> pays 1 monthly fee
- Owner with 3 horses -> pays 3 monthly fees
- Vet account with no horse ownership -> pays 0
- Vet account that also owns 1 horse -> pays 1 monthly fee
- Trainer account that also owns 2 horses -> pays 2 monthly fees

Important clarification:
- The same person can have multiple account types, but billing only applies to horses they own.

### 11.2 Free business usage (distribution strategy)

All business/service account types are free to use:

- Stables
- Trainers
- Veterinarians
- Transport providers
- Riding clubs
- Breeders
- Other horse service providers

Why:
- Free business tools reduce onboarding friction
- Businesses become growth channels
- Businesses invite owners to track horses in-platform
- Owner adoption increases naturally through operational use

### 11.3 30-day free trial (owner side)

Owner horse billing includes a 30-day free trial.

Trial intent:
- Let owners experience full value before payment
- Increase trust and reduce purchase hesitation
- Improve conversion after real usage (updates, schedules, invoices, records)

Operational note:
- Trial can be attached to first horse onboarding and/or first paid horse slot
- Exact trial enforcement details to be defined in product requirements

### 11.4 Business referral incentives

Business accounts earn ongoing commission when they refer paying horse subscriptions.

Primary incentive:
- **10% commission for the first year** on referred paying horses (see Section 19)

Additional optional incentives (non-core):
- Verification/status visibility boosts
- Premium business profile exposure
- Feature unlocks (non-core, optional)

Principle:
- Businesses are rewarded for successful owner conversion and active platform participation.

### 11.5 Billing policy decision

There will be no inactive-horse billing exception in this model.

Policy:
- If a user wants to add a horse as an owner, that horse is billable.
- No separate inactive/archived horse state for billing relief.

Rationale:
- Keeps monetization logic simple
- Prevents edge-case abuse
- Matches target market economics (horse owners already sustain high monthly costs)

### 11.6 Monetization summary

1. Businesses use the app free of charge
2. Horse ownership drives revenue
3. One horse = one monthly fee (**$99 placeholder** — subject to revision before launch)
4. Multi-role users pay only for owned horses
5. 30-day trial helps owner conversion
6. Business referrals accelerate growth
7. Modular competitor pricing (stable-paid, per-module) often passes through to owners; our model bills the owner directly for the connected hub

---

## Section 12 — Long-Term Platform Capabilities

Phased execution and MVP boundaries are defined in **Section 0** and **Section 18**.  
This section captures additional long-term capabilities not repeated elsewhere.

### 12.1 Buy / Sell capability

The platform will include horse transaction capability as part of the ecosystem.

Core rules:
- Each horse profile can have a recorded price/value field
- Price/value visibility helps owners and related accounts understand market context
- A horse having a price does **not** mean it is for sale
- The owner decides sale status explicitly (`Not for sale` / `For sale`)
- If marked `For sale`, deal flow can happen inside the app

Marketplace intent:
- Keep transaction context connected to horse history and verified relationships
- Reduce fragmented and opaque buying/selling processes

### 12.2 Mobile notifications

Platform notifications keep users updated on critical events (chat, medication, training, vet updates, invoices, competitions, buy/sell inquiries).

Booking-specific notification rules are defined in **Section 16.4**.

---

## Section 13 — Horse Data Dictionary (What We Must Build Later)

This section defines valuable horse data to include in the long-term product scope.

Important:
- We are not building all of this now
- This is a strategic reference of what the ecosystem should support over time
- Data ownership and visibility are relationship-based

### 13.1 Connected data ownership principle

The app is relationship-first. Data is created by the responsible account type and shared through verified links.

Examples:
- Vaccination and medical records are created/updated by the **Vet** account linked to the horse
- Training notes and performance analytics are created/updated by the **Trainer** account linked to the horse
- Boarding and care logs are created/updated by the **Stable** account linked to the horse
- Transport move records are created/updated by the **Transport** account linked to the horse
- Ownership, sale status, and pricing preferences are controlled by the **Owner** account

Access rule:
- Once a provider (vet/trainer/stable/etc.) is related to a horse, the horse owner can access the allowed data for that relationship scope.

### 13.2 Horse data categories

#### A) Identity and legal

Fields:
- Horse name
- Registry ID
- Microchip ID
- Passport number
- Breed, sex, date of birth, color/marks
- Country/legal documentation status

Why valuable:
- Legal traceability, transfer readiness, compliance confidence

#### B) Ownership and commercial status

Fields:
- Current owner(s)
- Ownership percentages (for syndicates/co-ownership)
- Purchase date and acquisition source
- Current estimated value / price
- Sale status (`Not for sale` / `For sale`)
- Sale listing details (when for sale)

Why valuable:
- Financial clarity and transaction readiness

#### C) Health and medical history (Vet-driven)

Fields:
- Vaccination records and due dates
- Medication schedules (drug, dose, start/end date)
- Treatment history (diagnosis, treatment plan, outcome)
- Injury and recovery timeline
- Vet visit logs
- Allergy/condition alerts
- Medical documents and reports

Why valuable:
- Risk reduction, continuity of care, owner trust

#### D) Training and performance (Trainer-driven)

Fields:
- Training schedule/calendar
- Session notes (text/media/voice)
- Goal plans and milestone tracking
- Discipline-specific performance indicators
- Competition preparation plans
- Performance trend analytics

Why valuable:
- Measurable horse progression and transparent trainer value

#### E) Stable and daily operations (Stable-driven)

Fields:
- Current stable and stable history
- Boarding dates and movement timeline
- Daily care logs
- Feeding/routine notes
- Stable service records

Why valuable:
- Operational continuity and welfare visibility

#### F) Breeding and lineage intelligence

Fields:
- Sire and dam information
- Pedigree tree
- Breeder identity and reputation data
- Bloodline performance analytics

Why valuable:
- Better breeding, investment, and valuation decisions

#### G) Financial and billing visibility

Fields:
- Vet invoices
- Trainer invoices
- Stable invoices
- Transport/other provider invoices
- Cost timeline per horse

Why valuable:
- Owner can see full horse cost in one place

#### H) Documents and certifications

Fields:
- Passport
- Insurance documents
- Ownership contracts
- Competition certificates
- Other legal/compliance documents

Why valuable:
- One trusted source for critical files

### 13.3 Minimum ownership visibility goal

For every horse, the owner dashboard should eventually provide:

1. Who currently manages/treats/trains this horse
2. Full health and medication timeline
3. Full training and performance timeline
4. Stable history and current status
5. Financial overview across all related providers
6. Sale/value status and transaction readiness
7. Documents center

### 13.4 Permissions and trust model for this data

Data access follows four dimensions:
- **Role-based**: who the account is (owner, vet, trainer, stable, etc.)
- **Relationship-based**: whether the account is linked to this horse
- **Scope-based**: what this account can read/write (medical, billing, notes, admin)
- **Time-based**: whether relationship is active or historical

This protects privacy while preserving connected workflows.

---

## Section 14 — Relationship Requests, Invitations, And Organic Growth

The platform should grow organically through real horse-world connections. Every relationship in the app must be meaningful, bidirectional, and accepted by both sides. There should be no unrelated or orphaned data sitting in the ecosystem without a path to verification.

### 14.1 Core principles

1. **Everything connected** — horses, owners, vets, trainers, stables, and other accounts exist in relation to each other, not in isolation
2. **Bidirectional by design** — every relationship works both ways (owner ↔ vet, vet ↔ horse, vet ↔ owner)
3. **Acceptance required** — no connection becomes active until the receiving party explicitly accepts
4. **Invite the missing party** — if the other account does not exist on the platform yet, the app invites them to join
5. **No dead data** — if a relationship is rejected or never confirmed, it does not persist as if it were real
6. **Collaborators are Users** — profile owner invites a User to collaborate at a host **role profile** (e.g. Stable) via `WorkplaceRelationship`; hierarchy on the link — see [`workplaceRelationship.md`](workplaceRelationship.md)

### 14.2 Relationship and workplace invitation flow

Every new **horse relationship** and every **workplace relationship** (User ↔ business) follows the same business pattern:

| | Horse/provider (`Relationship`) | Stable collaboration (`WorkplaceRelationship`) |
|---|--------------------------------|-------------------------------------|
| Link | Horse ↔ provider role profile | **User** ↔ host **role profile** (e.g. `Stable`) |
| Initiator | Owner, stable, vet, trainer, … | **Profile owner** or admin on that profile |
| Receiver | Other party | **Invited User** |
| Active after | User/provider accepts | **User** accepts |
| Hierarchy | N/A | `admin` \| `manager` \| `staff` on the **collaboration document** |

Horse relationship pattern:

```
Requester proposes connection
        ↓
Receiver gets notification (in-app + email/mobile)
        ↓
Receiver accepts or declines
        ↓
If accepted → connection becomes active, both sides can collaborate
If declined → requester is notified, no active connection exists
```

Workplace relationship pattern:

```
Business sends workplace invitation to User (by email)
        ↓
User gets notification (in-app + email)
        ↓
User accepts or declines
        ↓
If accepted → workplace relationship active
        ↓
Business sets hierarchy on that link (admin | manager | staff)
        ↓
Business assigns activities/jobs within permissions on that relationship
```

If declined → no access at that business; business may invite again.

A user may hold **multiple active workplace relationships** at different businesses. Scheduling must respect cross-business availability for the same person.

The stable does **not** own or control the user's account — only the **relationship document** between them.

This applies to all horse relationship types:
- Owner adding a vet to a horse
- Vet adding a horse to their practice
- Owner linking a trainer
- Trainer linking a horse
- Stable linking a horse or owner
- Any other provider ↔ horse ↔ owner connection

**Rule: the receptor always decides.** Nothing is forced.

### 14.3 Example — Owner adds a vet to a horse

**Scenario A: Vet already exists on the platform**

1. Horse owner searches the database and finds the vet
2. Owner sends a connection request: "I want to link you as vet for [Horse Name]"
3. Vet receives a notification with owner and horse details
4. Vet accepts → bidirectional relationship is active; vet can add medical records, owner can view them
5. Vet declines → owner is notified; no connection exists

**Scenario B: Vet does not exist on the platform**

1. Horse owner cannot find the vet in the database
2. Owner adds minimal vet details (name, email, and any known info)
3. App sends an invitation email to the vet: "A horse owner has added you as their vet on [App Name]. Sign up to connect and manage your equine patients."
4. If vet signs up and accepts → relationship becomes active
5. If vet declines or ignores → owner is notified; the vet is treated as if they did not exist in the database (no active connection, no shared data)

### 14.4 Example — Vet adds a horse (reverse direction)

The same logic works in reverse:

**Scenario A: Horse already exists on the platform**

1. Vet searches and finds the horse
2. Vet sends a connection request to the horse owner
3. Owner receives notification: "Dr. [Name] wants to connect as vet for [Horse Name]"
4. Owner accepts → relationship active
5. Owner declines → vet is notified; no connection

**Scenario B: Horse does not exist on the platform**

1. Vet cannot find the horse in the database
2. Vet adds minimal horse details (name, breed, owner name, owner email, etc.)
3. App sends an invitation email to the owner: "Your vet Dr. [Name] has added [Horse Name] on [App Name]. Sign up to track your horse's health, training, and more."
4. If owner signs up and accepts → relationship becomes active
5. If owner declines or ignores → vet is notified; no active connection

### 14.5 Growth loop (business model advantage)

This invitation system is a core growth engine, not just a feature:

```
User A joins → adds relationship to User B (not on platform)
        ↓
User B receives invite with real context (not a cold signup)
        ↓
User B joins because there is already value waiting (their horse, their client)
        ↓
User B adds their own relationships → invites User C
        ↓
Network grows organically through real horse-world connections
```

Why this works:
- Invites are **contextual** — "your vet added your horse" is much stronger than a generic signup email
- Every new user arrives with **pre-built relationships** ready to activate
- Businesses (vets, trainers, stables) become **free promoters** because the app helps their workflow
- Owners are **natural payers** once they see their horse data already populated

### 14.6 Data trust and rejection handling

| Situation | What happens |
|-----------|-------------|
| Request pending | Visible only to requester as "awaiting confirmation" |
| Request accepted | Active bidirectional relationship; shared data flows |
| Request declined | Requester notified; no connection; may send again after alignment |
| Invite sent, no response | Reminder after defined period; eventually expires |
| Invite declined after signup | Same as decline — no active connection; may resend |
| Relationship accepted | Permanent record; owner access to their horse data retained even if later `ended` or disputed |

Key rule from product policy:
- If a relationship is **not accepted**, the platform behaves as if that party was never operationally connected
- If a relationship **is accepted**, it is permanent for history, owner read access (their horses only), and horse-scoped reviews — even when service ends or parties disagree

### 14.7 Invitation safeguards (business rules)

To keep the system trustworthy and avoid abuse:

- Rate limits on invitations per user (prevent spam)
- Clear opt-out for invite recipients
- Duplicate detection (same vet/horse/owner added by multiple people should merge, not duplicate)
- Trust indicators on profiles (verified, pending, unverified)
- Reminder emails only (no harassment-level follow-ups)

Details of enforcement will be defined during product requirements, not in this business plan.

### 14.8 Summary

The relationship and invitation model is central to the business:

1. Real connections drive signups — not marketing spend
2. Both sides must accept — trust is built in from day one
3. Missing parties get invited with context — not cold outreach
4. Rejected connections leave no trace — data stays clean
5. Businesses grow the network for free — owners fund the platform

---

## Section 15 — Interaction Policy (Utility-First Social Layer)

All account types can have profile pages and social elements, but interaction design follows this rule:

**Utility first, social second.**

The platform is a connected professional horse ecosystem, not a generic open social network.

### 15.1 Why this approach

- Keeps trust high in a reputation-sensitive industry through horse-scoped reviews
- Enables fast communication with open live chat (WhatsApp-like behavior)
- Protects businesses from invalid cross-context reviews
- Preserves focus on workflows owners actually pay for

### 15.2 Interaction model

#### A) Public discovery layer

Anyone can navigate and discover accounts through profile pages.

Public profile elements can include:
- Photos and media
- Description and specialties
- Services offered
- Basic account details
- Relationship highlights
- Structured rating summary (aggregated from horse-scoped verified reviews)
- Verification/trust badges

Purpose:
- Help users find the right providers and understand quality quickly

#### B) Open live chat layer (WhatsApp-style)

Live chat is available between users/accounts without requiring an accepted horse relationship first.

Behavior:
- Any user can start and maintain conversations with other users, similar to WhatsApp
- Chat supports real-time bidirectional communication platform-wide
- Conversations can optionally reference horse/service context when relevant

Important separation:
- **Chat is open**
- **Reviews are not open** (see Section 15.3)

#### C) Relationship collaboration layer (operational data)

Operational records and workflows unlock through accepted horse relationships.

Examples:
- Medical records and treatment updates (vet)
- Training logs and performance updates (trainer)
- Boarding/care records and invoices (stable)
- Transport move records and trip status (transport)

Rule:
- Sensitive operational data requires accepted relationship and role permissions
- Chat availability does not replace relationship acceptance for operational data access

#### D) Private control layer

Sensitive data stays restricted by permissions.

Examples:
- Medical details
- Financial details
- Owner-private documents
- Internal notes

Access is governed by role, relationship, scope, and time rules defined in this plan.

### 15.3 Reviews policy (strict relationship + horse scope, bidirectional)

- Reviews/ratings are allowed only from verified relationships (accepted or ended — permanent history)
- Every review must be linked to a specific horse involved in that relationship (`horseId` + `relationshipId`)
- **Either party** in the relationship may review the other in that horse context — not owner→provider only
- Horse-side reviews use the **owner/co-owner** as operator; entity-side reviews use an authorized profile operator
- No open anonymous review wall
- No cross-horse review reuse
- Reviewees can respond to feedback in a structured way

Examples:
- Owner with Horse 1 at Stable S: owner reviews Stable S; Stable S reviews Horse 1 (horse care, behavior, owner cooperation) — both in Horse 1 ↔ Stable S context
- Vet A treats Horse 1 at Stable S: vet may review stable facilities; stable may review vet; owner may review vet — each tied to the same horse relationship gate
- Owner with Horse 1 (Vet A) and Horse 2 (Vet B): reviews for Vet A only in Horse 1 context; reviews for Vet B only in Horse 2 context

This keeps reputation systems useful, fair, and defensible.

### 15.4 Navigation and interaction goal

Users should be able to:

1. Discover any relevant account type easily
2. Understand profile quality and trust signals quickly
3. Chat freely with other users in real time
4. Request and accept horse relationships for operational collaboration
5. Leave horse-scoped reviews only where a valid relationship exists (either direction)
6. Access shared records and workflows after relationship acceptance

### 15.5 Business positioning summary

The product should feel like:

- A connected horse-industry operating network
- With social/profile benefits
- Anchored in verified relationships and real workflows

Not:
- A generic "Instagram for horses" model

---

## Section 16 — Booking, Scheduling, And Real-Time Communication

Booking and schedule management are mandatory platform capabilities.

This applies to:
- Vets
- Trainers
- Stables
- Transport providers
- Horse owners

### 16.1 Core booking principle

Owners and related accounts should be able to book services in-app, not through fragmented external channels.

Examples:
- Owner books vet visit
- Owner books training session
- Owner requests stable boarding/service slot
- Owner books horse transport
- Provider proposes schedule to owner for confirmation

### 16.2 Request and acceptance flow

All booking requests follow a confirmation workflow:

1. Requester creates booking request in-app
2. Receiver gets instant notification
3. Receiver accepts or declines
4. If accepted, booking becomes confirmed and visible in shared schedule
5. If declined, requester is notified and can propose a new slot

Rule:
- No booking becomes final without receiver acceptance.

### 16.3 Real-time bidirectional communication

The platform provides open live chat (Section 15.2) and uses it in booking workflows.

Requirements:
- Real-time chat available between users platform-wide (WhatsApp-style)
- Booking events can happen inside chat threads with horse/service context attached
- Instant status updates for booking events (requested, accepted, declined, rescheduled, canceled)

Purpose:
- Remove delays and ambiguity in horse operations
- Keep users aligned in real time without requiring relationship acceptance for basic messaging

### 16.4 Notification policy for bookings

Notifications should be immediate and event-driven.

Minimum booking events for notifications:
- New booking request
- Booking accepted
- Booking declined
- Booking rescheduled
- Booking canceled
- Upcoming booking reminder

Channels:
- In-app notification
- Mobile push notification (FCM)
- Optional email notification for critical booking events

Realtime delivery: see `stack.md` §9.3 (REST first, Socket.io in Equus when live chat requires it).

### 16.5 Shared schedule visibility

Once a booking is confirmed, it should appear in the relevant schedules:

- Owner calendar
- Provider calendar (vet/trainer/stable/transport)
- Horse timeline/activity where relevant

This keeps operational planning connected and transparent for all related parties.

### 16.6 Marketplace priority policy

Marketplace is recognized as an important long-term component, but it is the last and hardest part of the app to implement well.

Strategic decision:
- We will not prioritize marketplace execution now
- We will keep marketplace requirements in mind while designing core data and relationships
- Current focus remains on operational workflows, communication, scheduling, records, and owner visibility

Timing principle:
- Marketplace moves forward only after the core workflow product is stable, trusted, and adopted.

---

## Section 17 — Trust And Performance Badge Policy

Business accounts should be differentiated by meaningful trust and performance signals, not only a single generic verification marker.

### 17.1 Badge strategy (hybrid model)

The platform should use two badge layers:

1. **Trust verification status** (foundational trust)
2. **Earned performance badges** (visible differentiation)

Positioning:
- Verification confirms authenticity and legitimacy
- Performance badges communicate real operational quality

### 17.2 Trust verification status

Verification remains a baseline trust layer in the product.

Purpose:
- Confirm account legitimacy
- Reduce fake profiles and identity confusion
- Increase confidence in business discovery

Note:
- Verification is not the main competitive signal; earned badges are.

### 17.3 Earned performance badge categories

#### A) Experience / volume badges

Awarded based on verified horse relationships and operational history.

Examples:
- `Cares for 25+ horses`
- `Cares for 100+ horses`
- `Discipline Specialist` (minimum horse volume in a specific discipline)

#### B) Quality badges

Awarded based on verified reviews and outcomes.

Examples:
- `Top Rated` (minimum rating threshold + minimum verified review count)
- `Excellent Communication`
- `Consistent Care`

#### C) Reliability badges

Awarded based on operational behavior.

Examples:
- `Fast Response`
- `High Booking Acceptance`
- `Reliable Scheduling`

### 17.4 Badge integrity rules (anti-abuse)

To preserve trust, badges must follow strict rules:

- Count only **verified relationships** (no self-claimed volume)
- Count only **verified interactions** for reviews
- Enforce **minimum sample size** before badge eligibility
- Use **time windows** (recent performance), not only lifetime totals
- Remove or downgrade badges when criteria are no longer met
- Show transparent badge criteria in-app ("How this badge is earned")

### 17.5 Product impact

This model improves discovery and trust by making profile quality easier to evaluate quickly.

Benefits:
- Owners can compare providers with clearer signals
- Businesses are rewarded for operational excellence, not just profile setup
- Reputation becomes performance-driven and harder to manipulate

---

## Section 18 — Phased Execution Plan (Phase 1 -> Phase 12)

This section converts strategy into a practical phased plan.  
It is intentionally business-oriented and prioritizes sequencing over technical implementation detail.

### Phase 1 — Incremental build wedge (not production launch)

Phase 1A/1B in [`mvpScope.md`](mvpScope.md) are **incremental build milestones** toward production — not the public launch bar.

Wedge goal:
- Validate workflows and ship core loops early (owner ↔ stable ↔ trainer): relationships, chat, booking, basic invoices, documents.

**Public production launch** requires fully implemented modules: **User**, **Horse**, **Veterinary**, and **Stable** (see `mvpScope.md` — Production launch requirements). Stable scope is defined in [`stableModule.md`](stableModule.md).

Exclude from initial production (post-launch expansion):
- Full marketplace and deal execution
- Advanced breeder / studfarm webshop suite
- Deep bloodline analytics engine
- Advanced transport operations module

### Phase 2 — Average timeline

Average execution timeline (high-level):

- **Month 0-1**: validation + interviews + final MVP definition
- **Month 2-4**: build core MVP workflows (owners/stables/trainers)
- **Month 5-6**: pilot with first real users, fix critical workflow gaps
- **Month 7-9**: strengthen retention features (notifications, records quality, booking reliability)
- **Month 10-12**: scale local adoption and prepare next module expansion (vet first)

This is an average planning timeline and can shift based on validation outcomes.

### Phase 3 — Validation plan (see `validationPlaybook.md`)

Before aggressive build expansion, validate workflow pain and willingness-to-pay.

Interview targets:
- 10 stable owners
- 10 trainers
- 10 horse owners

Core validation questions:
- What tools they use today
- What is most painful in horse management
- What they already pay for
- Whether they would pay for a solution that removes the main pain

Decision signal:
- Strong direct willingness to pay is a go signal
- Weak "maybe" feedback means iterate positioning/scope before expanding

### Phase 4 — Go-to-market linked to validation

This phase is directly connected to Phase 3.

GTM approach:
- Start with stables and trainers as the wedge
- Offer free business usage to reduce friction
- Use relationship invitations to bring owners in
- Focus on one geography/community cluster first
- Convert owner value through expense visibility + communication + control

Launch objective:
- Real operational usage, not vanity signups

### Phase 5 — Pricing start point

Initial owner pricing (placeholder — subject to revision before launch):
- **$99 per horse per month**

Pricing rationale vs modular competitors:
- Stable-centric tools (e.g. EquineM) advertise low per-horse activity fees but charge separately per module (feed, facilities, team, finance, bookkeeping); a full operational stack per horse approaches a similar all-in monthly cost
- Our model bills the **owner directly** for one connected horse hub (records, providers, reviews, discovery, communication) while **business accounts stay free**
- Stables using modular competitors typically **pass software cost through** to owners in boarding or service fees; the payer differs, not necessarily the total industry spend

Rules:
- Billing tied to horse ownership
- Business account usage remains free at core level
- Trial and referral mechanisms remain active to support conversion and growth

### Phase 6 — Keep strategy aligned with trust

Trust is a product and business requirement.

Trust rules:
- Horse-scoped reviews only from verified relationships
- Relationship acceptance required for operational data access (no forced links)
- Open live chat between users (WhatsApp-style)
- Merit-based badges (not pay-to-win reputation)
- Transparent criteria for ratings and trust indicators

### Phase 7 — Ownership, payment, transfer, and ended-relationship logic

#### 7.1 Multi-owner horses and billing

- A horse can have multiple owners
- Co-owners can be linked to the horse profile
- Billing responsibility belongs to the main user who created the horse profile
- Main payer remains accountable for the horse subscription fee

#### 7.2 Horse transfer flow

- Transfer should be simple: move the horse's main ownership reference from User A to User B
- Horse history and related records remain intact through transfer

#### 7.3 Established, ended, and rejected relationship behavior

**Rejected or never accepted:**
- No operational connection exists
- Requester is notified; they may send a new request (e.g. after owner/stable alignment via open chat)
- No shared operational data is created

**Established (accepted) — permanent record:**
- Once accepted, the relationship is **never deleted**
- If the horse leaves the stable or service ends, status becomes `ended` but the full historical record remains
- Owner retains read access to **their horse's** data from that stable relationship, including during disputes
- Horse-scoped reviews and ratings remain available for that verified relationship context
- Active **write** privileges (e.g. stable daily logs) follow current hosting policy; ended relationships do not grant ongoing operational write access

**Traceability:**
- Historical data keeps a static reference for audit and continuity
- Data export and portability follow platform policy and applicable law regardless of vendor

### Phase 8 — Data ownership, writing rights, and privacy policy baseline

Writing permissions are owner-of-feature based:

- Vet writes medical data
- Trainer writes training/performance data
- Stable writes stable/care/boarding records
- Transport writes transport/move records and trip status data
- Owner writes ownership/commercial preferences and owner-level profile data

Viewing permissions:
- Connected/related parties can view allowed data by role and scope
- Public data remains publicly visible by policy
- Sensitive data follows private/restricted access rules

Compliance principle:
- Privacy and policy standards follow common business-grade app standards

### Phase 9 — Business metrics layer (internal/private)

Create an internal metrics view (private area for development/team use only) to monitor business health.

Suggested core metrics:
- Active horses
- Paying horses
- MRR and churn
- New relationship requests and acceptance rate
- Booking requests, acceptance rate, and completion rate
- Message responsiveness
- Owner invite conversion from business accounts

Access policy:
- Private/internal access only (not public user-facing)

### Phase 10 — Strategic principles

Core strategy:

- Start narrow, then expand
- Become indispensable in one painful workflow first
- Prioritize stable/trainer operations + owner communication
- Marketplace is last and hardest, not an early focus
- Validation before overbuilding is mandatory

Positioning reminder:
- The opportunity exists because this market is fragmented and operationally underserved

### Phase 11 — Correct signup and account creation flows

Canonical flow:
- User signs up → personal profile → add horse → invite stable via relationship
- Stable owner signs up → personal profile → create stable → invite/link horse
- Horse owner signs up → personal profile → add horse → invite vet via relationship (Phase 2+)
- Vet signs up → personal profile → create veterinary profile → invite/link horse (Phase 2+)
- Transport operator signs up → personal profile → create transport business → invite horse/owner (post-MVP)

Policy:
- User identity always comes first
- Domain profiles are added after personal profile creation
- Provider links use the `Relationship` model (pending invites store email until account exists)

Technical implementation: see `stack.md` and `productFlows.md`.

### Phase 12 — Transport module rollout

Transport is fully defined as an entity and module (see **Section 4.10** and **Transport module in Section 10.3**).

Rollout intent:
- Keep transport in identity and data model from early planning
- Expand transport operations after core wedge traction (post Phase 1 MVP)
- Reuse shared booking, chat, notifications, invoices, and relationship flows

---

## Section 19 — Partner Revenue Share Program

Businesses are not only free users — they can earn commission when they help bring paying horse subscriptions to the platform during the first year of each referred horse.

Strategic intent:
- Incentivize businesses to actively refer horse owners
- Turn stables, trainers, vets, and other providers into a cooperative growth network
- Align platform growth with real paid value, not vanity signups

### 19.1 Core commission rule

- Owner subscription: **$99 per horse per month**
- Business commission: **10% per referred paying horse**
- Commission duration: **first 12 months only** (from the horse's first successful paid subscription), then **0%**

Example:
- Vet refers a horse that becomes a paying subscription
- Platform earns $99/month
- Referring business earns $9.90/month for that horse during the first 12 paid months
- After month 12, commission ends; the horse subscription continues at full price with no partner payout

### 19.2 One horse, one attribution source

Attribution is exclusive per horse.

Rules:
- Each horse can have only **one** commission-attributed business source
- If multiple businesses add/refer the same horse, only one source is credited
- The credited source is determined by the **first referral reference used by the owner at signup**

### 19.3 Referral reference number model

Every invitation email includes a unique referral reference number tied to the inviting business and horse context.

Attribution logic:
1. Business sends invitation with reference number
2. Owner signs up through that invitation flow
3. The first reference number used by the owner becomes the permanent attribution source for that horse
4. Later invitations for the same horse do not override attribution

This keeps attribution fair, traceable, and deterministic.

### 19.4 Commission eligibility and payout conditions

Commission is paid only on real revenue.

Rules:
- Commission is calculated only on **paid bills** (successful subscription charges)
- No commission on trial-only or unpaid states
- If a subscription payment fails/refunds/chargebacks, corresponding commission is not earned for that cycle
- Commission applies only during the **first 12 months of paid subscription** for that attributed horse
- After the 12-month commission window ends, no further commission is paid for that horse

Fraud prevention principle:
- Businesses earn only when the platform earns

### 19.5 Active business requirement

Commission is available only to **active businesses**.

A business must remain operationally active on the platform to receive commission (for example: minimum monthly logins/usage threshold).

Purpose:
- Prevent inactive accounts from passively collecting commission
- Encourage real platform usage, not referral-only behavior

Note:
- Exact activity threshold will be defined in product policy.

### 19.6 Why first-year 10% (business decision)

First-year commission is intentional.

Benefits:
- Strong incentive for businesses to refer new paying horses
- Sustainable unit economics after year one (full margin retained on long-term subscriptions)
- Reduces long-term payout exposure while keeping partner motivation high at acquisition
- Aligns commission with the highest-value growth phase (new horse onboarding)

Tradeoff management:
- Commission is earned only on successful paid billing during the first 12 months
- Platform keeps full subscription revenue after the commission window ends

### 19.7 Program summary

1. Businesses use core app for free
2. Businesses refer horses through invitation links with reference numbers
3. First reference used at owner signup wins attribution
4. Owner pays $99/month per horse
5. Attributed business earns 10% on paid subscription cycles for the first 12 months only
6. Commission requires active business status and successful paid billing

---

## Section 20 — Competitive Positioning (Stable-Centric Tools)

Reference competitor baseline: [`equinem.md`](equinem.md).  
Stable capability target: [`stableModule.md`](stableModule.md).

EquineM and similar products are **stable-organization ERP**: the stable admin pays, owns the tenant, and adds owners/vets as contacts inside one org. Our product is a **connected horse ecosystem**: the horse is central, actors link by consent, businesses use the platform free, and owners pay for the unified horse hub.

### 20.1 Who pays — same industry cost, different payer

In practice the **horse owner** often bears software cost in both models:

- **EquineM:** modular fees (per-horse activity, feed, facilities, team, finance, bookkeeping) are paid by the stable and typically **passed through** in boarding or service pricing
- **Us:** owner pays subscription directly and receives **additional owner-facing value**: horse-scoped reviews and ratings across businesses, discovery, connectivity with providers and other owners, unified timeline, and portable records

The difference is **who invoices whom on the platform**, not whether the owner ultimately participates in the cost of digital horse management.

### 20.2 Feature depth — build phase vs destination

Early build phases (Phase 1A/1B) intentionally ship a wedge before full parity. **Production launch** requires User, Horse, Veterinary, and Stable modules fully implemented (`mvpScope.md`).

Destination: **match EquineM stable operations** (see `stableModule.md` parity sections) and **exceed** with ecosystem features EquineM does not center (Section 20.5).

### 20.3 Transparency and owner access

Platform policy:

- Stables that are not willing to provide **owner-transparent** horse data for horses they host are not a fit
- Owners see **only their own horses** — never other clients' animals
- Owner and stable align via **open chat** before linking; acceptance is explicit but the flow is minutes (invite → email → accept)
- **Established relationships are permanent** — history and owner read access remain after departure or dispute; horse-scoped reviews remain valid in that context

### 20.4 Onboarding speed vs trust

Relationship acceptance is not "slow onboarding" — it is **trust by design**. The typical flow (invite, email, accept) completes in **minutes**. Declined requests can be resent after clarification. Unaccepted requests never create operational data.

### 20.5 Pricing comparison

EquineM advertises low per-horse activity fees but charges **separate modules**; a horse that needs full barn operations (activity, feed, facilities, team, finance, bookkeeping) approaches an **all-in monthly cost comparable to our placeholder owner price**.

Our **$99/horse/month** is an **initial placeholder** subject to revision before launch. Value proposition: one owner subscription for the connected hub vs assembling modular stable-centric fees plus limited owner-facing product.

### 20.6 Data portability and stable fit

Owners can request their data when changing stables regardless of vendor; we additionally encode **permanent established relationships** and owner visibility so transparency is product-default, not an export afterthought.

Stables seeking opaque, owner-excluded operations should use closed barn software; we target stables that compete on **service quality and transparency**.

### 20.7 Summary — stable admin value proposition

| Topic | EquineM-style | Our platform |
|-------|---------------|--------------|
| Payer on platform | Stable (pass-through to owner common) | Owner (direct) |
| Stable software cost | Modular subscription | Free |
| Center of data | Stable organization | Horse + relationships |
| Owner product | Portal inside stable tenant | Full ecosystem hub |
| Reviews / discovery | Not core | Horse-scoped reviews + discovery |
| Vet/trainer | Contacts in org | Independent linked accounts |
| Production bar | Mature product today | User + Horse + Vet + Stable modules complete |
