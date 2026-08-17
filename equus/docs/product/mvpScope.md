# Build Phases and Production Launch

Incremental build (Phase 1A / 1B), **production launch gate**, and post-launch exclusions.

Canonical product: [`businessPlan.md`](businessPlan.md) lock table. Vision [`vision.md`](vision.md) · graph [`graph-and-identity.md`](graph-and-identity.md) · money [`monetization.md`](monetization.md) · GTM [`go-to-market.md`](go-to-market.md).

Module specs: `equus/docs/features/userModule.md`, `horseModule.md`, `stableModule.md`. Market extract: [`firstDeliveryCompetitiveBacklog.md`](firstDeliveryCompetitiveBacklog.md). Stack: [`../engineering/stack.md`](../engineering/stack.md).

---

## First delivery priority

1. **User + Horse (social Hub)** — My Graph, profiles, chat, favorites, horse Hub, relationships (both invite paths), waiting-transfer nags. Feature IDs: `U-FD-*`, `H-FD-*`.
2. **Stable SaaS** — roster, stalls, whiteboard/tasks, health, feed, docs, finance, facilities, **included owner portal** while the stable is in good standing. Feature IDs: `S-*`, `S-FD-*`.

Catalog and suggested order: [`firstDeliveryCompetitiveBacklog.md`](firstDeliveryCompetitiveBacklog.md). Market rows are **additive** to module specs.

---

## Terms

| Term | Meaning |
|------|---------|
| **Phase 1A / 1B** | Build milestones toward launch — not the public bar by themselves |
| **Production launch** | Public release only when **User**, **Horse**, and **Stable** modules are fully implemented per their specs |

**Veterinary is not in the launch gate.** Vet (and trainer, groomer, …) ship after as independent paid SaaS.

---

## Technical implementation

Aligned with `equus/docs/engineering/stack.md`:

| Area | Approach |
|------|----------|
| Web app | Next.js (App Router) + shadcn/ui + Tailwind + Zod |
| API | REST `/api/v1/*` + `lib/services` |
| Auth | Auth.js (web); JWT for mobile clients |
| Database | MongoDB Atlas + Mongoose |
| Data fetching | TanStack Query |
| Uploads | Cloudinary |
| Chat | REST messages; Socket.io when chat UX requires it |
| Billing | Stripe (or equivalent) on **entity** subscription; customer = owning User |
| Mobile | React Native (Expo) on the same REST API |
| i18n | **English default**; Spanish and Portuguese at launch |

---

## Build goal (wedge)

Become indispensable **daily stable software** for Spanish stables, with owners on a **free Hub + chat + portal**. Success is operational usage, not vanity signups.

---

## Phase 1A — First build milestone

Target: ~8–10 weeks after validation ([`validationPlaybook.md`](validationPlaybook.md)).

### In scope

#### Identity
- User signup/login (Auth.js; JWT API for mobile)
- Personal profile; **browse-first** (no role required to search **horses and stables**)
- **No people search**
- Create horses and stables when ready; one login
- Home: **My Graph**
- **Favorites** (horses and stables)

#### Horse
- Create profile (identity, photos, visibility, contact display)
- `mainOwnerUserId` + waiting-transfer flag when stable-created
- Hub (social) + timeline for relationship-scoped activity
- Documents via Cloudinary

#### Relationships
- **Path 1:** horse owner invites stable; stable accepts/declines; resend after decline
- **Path 2:** stable creates boarded horse (owner email required) → waiting-transfer + **daily nag forever** until claim
- Invite unregistered party by email
- Established relationships permanent; `ended` keeps history
- **No** referral-commission reference numbers

#### Workplace
- Stable owner invites **Users** as collaborators (`WorkplaceRelationship`)
- Multi-stable collab allowed

#### Communication
- Open WhatsApp-style chat (no relationship required)
- Notifications for messages, relationships, waiting-transfer, billing (entity)

#### Booking (basic)
- Owner ↔ stable booking request / accept / decline
- Shared calendar on horse + stable

#### Stable ops (basic)
- Roster, care notes, invoices to owners, documents
- Owner **portal** for live data iff stable in good standing

#### Entity billing (stub OK in 1A; required before production)
- Catalog bands + 30-day default free on new stable
- Price stored on entity (overridable)
- Currency from entity location
- Lapse: 7-day grace then write-lock (can be stubbed in 1A)

#### Trust (minimal)
- Horse-scoped bidirectional reviews on verified relationships
- No badge engine in 1A

#### Ownership transfer
- `OwnershipTransfer` for horses and stables — see `equus/docs/features/ownershipTransfer.md` (claim from waiting-transfer is in 1A)

### Phase 1A acceptance criteria

- [ ] Owner adds horse, invites stable, stable accepts; both see shared horse context
- [ ] Stable creates boarded horse with owner email; waiting-transfer nags fire; owner claims and becomes `mainOwner`; stable remains host
- [ ] Open chat without a relationship
- [ ] Owner requests booking; stable accepts/declines
- [ ] Invoices/care visible in owner Hub **while** stable is in good standing; social Hub still works if not
- [ ] Favorites for horse and stable
- [ ] My Graph shows horses, workplaces, pending invites
- [ ] Unregistered stable/owner email invite works
- [ ] Review only for horse-specific verified relationship
- [ ] Collaborator invite → user accept → hierarchy on link

---

## Phase 1B — Hardening and pilot

Target: ~4–6 weeks after 1A pilot feedback.

### In scope

- Real Stripe (or equivalent) charging after 30-day entity offer
- Promo periods attachable on the entity
- Lapse 7-day reminders + write-lock
- Stronger notifications (booking, invoice, waiting-transfer, payment)
- Document folders/tags per horse
- Full-enough stable roster + activity for a real Spanish yard
- Internal admin metrics ([`metricsSpec.md`](metricsSpec.md))
- Pilot polish

**Out of 1B:** owner subscriptions, partner 10% commissions, veterinary module as launch requirement, trainer as a full SaaS module (trainers may collaborate as Users).

### Phase 1B acceptance criteria

- [ ] Stable converts from 30-day free to **paid entity** subscription (or custom price)
- [ ] Lapse path: grace then write-lock; owner loses **live** portal; chat + public page remain
- [ ] Pilot stable uses app weekly with a real roster (target: 5+ horses in flow)
- [ ] Waiting-transfer daily nags still running for unclaimed horses

---

## Production launch requirements

**Do not open public production** until all three modules are fully implemented, tested, and criteria pass.

| Module | Spec | Launch bar |
|--------|------|------------|
| **User** | `equus/docs/features/userModule.md`, [`graph-and-identity.md`](graph-and-identity.md) | Signup, login, profile, My Graph, chat, favorites, workplace invites, multi-hat, EN/ES/PT |
| **Horse** | `equus/docs/features/horseModule.md` | Hub, ownership, waiting-transfer, timeline, documents, discovery (horses), relationships |
| **Stable** | `equus/docs/features/stableModule.md` | EquineM-parity ops (profile, roster, activity, team, facilities, feed, finance, communication) + billing + owner portal |

### Production acceptance criteria (cross-module)

- [ ] One User operates horses and/or a stable under one login
- [ ] Horse is the shared record; owners see only their horses
- [ ] Stable runs daily stable workflows per `stableModule.md`
- [ ] **Stable pays** (catalog or custom); owners **never** pay Equus
- [ ] Owner portal live only in entity good standing
- [ ] Established relationships permanent; history after `ended`
- [ ] Workplace collab; same user at two stables
- [ ] Horse-scoped reviews
- [ ] Both relationship start paths (owner invite + stable create + claim)

### Post-launch modules (not launch gate)

Veterinary, trainer, groomer, transport, breeder, riding club — each a module with its own paid SaaS when built. Trainers/vets at launch = Users + optional stable collaboration.

---

## Explicitly out of scope (post-production)

### Product
- Full marketplace / in-app deal execution
- Follow, likes, public social feed
- Breeder / stud webshop (EquineM stud)
- Deep transport ops
- Riding club as separate SaaS (lesson subset at a stable only if chosen)
- Bloodline analytics engine
- Badge automation
- AI features
- Owner-paid Equus subscriptions

### Technical / ops
- Elasticsearch
- Redis / separate Nest backend / Python services
- Complex syndicate **Equus** billing splits (owners are not billed)
- Automated review dispute engine
- Full GDPR legal portal (baseline privacy at launch)

**Not deferred:** EN + ES + PT (required at launch).

---

## Phase priority by role

| Role | 1A | Production gate |
|------|----|-----------------|
| Horse owner (free) | High | Required |
| Stable (paid) | High | Required |
| Veterinary | After launch | Not in gate |
| Trainer | Collaborator User | Not in gate |
| Transport / breeder | Deferred | Post-launch |

---

## Positioning (one line)

> Stables pay for stable SaaS; owners get a free horse Hub, chat, and a live portal while the yard’s subscription is in good standing.

---

## Decision gates

- Do not start Phase 1A until [`validationPlaybook.md`](validationPlaybook.md) go/no-go (Spanish **stables** WTP for yard SaaS).
- Do not open **public production** until **Production launch requirements** above.
