# Build Phases and Production Launch

This document defines **incremental build phases** (Phase 1A/1B), the **production launch gate**, and what is explicitly deferred post-launch.

Source of truth:
- `businessPlan.md` — Section 0, Section 18, Section 20 (competitive positioning)
- `stableModule.md` — stable feature specification (living doc)
- `stack.md` — technical stack (canonical)

---

## Important distinction

| Term | Meaning |
|------|---------|
| **Phase 1A / 1B** | Early build milestones — ship and validate core loops with pilot users |
| **Production launch** | Public release only when **User**, **Horse**, **Veterinary**, and **Stable** modules are fully implemented per their specs |

Phase 1 completion does **not** equal production launch.

---

## Technical implementation

Aligned with `stack.md`:

| Area | Approach |
|------|----------|
| Web app | Next.js (App Router) + shadcn/ui + Tailwind + Zod |
| API | REST `/api/v1/*` Route Handlers + `lib/services` |
| Auth | Auth.js (web); JWT login/refresh endpoints (mobile-ready) |
| Validation | Zod at API boundary and web forms |
| Database | MongoDB Atlas + Mongoose (`equus/models/`) |
| Uploads | Cloudinary |
| Chat | REST messages; Socket.io realtime when chat UX requires it (`stack.md` §9.3) |
| Mobile app | React Native (Expo) — API designed for mobile from day one; native app can follow web |

---

## Build goal (wedge)

Become indispensable in daily horse operations for **owners, stables, and trainers** while working toward full **Stable** and **Veterinary** module parity (see `stableModule.md` and `businessPlan.md` Section 10.3).

Success means real operational usage, not vanity signups.

---

## Phase 1A — First build milestone

Target timeline: ~8–10 weeks after validation (see `validationPlaybook.md`).

### In scope

#### Identity and accounts
- User signup/login (Auth.js on web; JWT API for mobile clients)
- Personal profile creation
- **Browse-first signup** — new users have no roles; they can search stables, trainers, vets, horses, etc.
- Create horses and role profiles when ready: **horse** (entity-owned), **stable**, **trainer**, and others (each type has its own model)
- One login; navigate between roles in the app (no persisted account context)

#### Horse discovery
- Per-horse visibility (`Horse.profileVisibility`, default `public`)
- Per-horse public contact (`Horse.contactDisplay` — owner contact or delegate)
- See [`userAndRoles.md`](userAndRoles.md)

#### Horse core
- Create horse profile (name, breed, age/sex, photos, basic details)
- Main owner assignment (payer of record)
- Horse dashboard/timeline (basic activity feed)

#### Relationships
- Search existing accounts (stable/trainer)
- Send relationship request via `Relationship` model (horse ↔ stable, horse ↔ trainer)
- Accept / decline requests; **resend after mistaken decline**
- Invite non-registered party by email (`invitedName` + `invitedEmail` on pending relationship; link to account on signup)
- Referral reference number on invitation emails (for Section 19 attribution)
- **Established relationships are permanent** — see `businessPlan.md` relationship rules

#### Communication
- Open live chat between users (WhatsApp-style)
- In-app + push notifications for messages and relationship events
- Phase 1A: REST message send + polling acceptable; Socket.io realtime when chat UX requires it

#### Booking (basic)
- Create booking request (owner → stable/trainer)
- Accept / decline booking
- Shared calendar view per horse and per business account
- Booking status notifications

#### Operations (basic)
- Create and view invoices per horse (stable/trainer → owner visibility)
- Owner expense summary per horse (total + invoice list)
- Upload/view basic documents via Cloudinary (passport, contracts, PDFs/images)

#### Owner billing (integration-ready)
- 30-day trial per horse
- Subscription logic: **$99/horse/month placeholder** (integration can be stubbed in 1A; required before production)
- Main owner pays; co-owners can be linked without separate billing

#### Trust (minimal)
- Horse-scoped reviews only after verified established relationship
- No badges engine in 1A (manual/trust flags only if needed)

### Phase 1A acceptance criteria

- [ ] Owner can add horse, invite stable, stable accepts, both see shared horse context
- [ ] Trainer can post session note visible on horse timeline for linked horse
- [ ] Owner and stable/trainer can chat without prior relationship (open chat)
- [ ] Owner can request booking; business can accept/decline
- [ ] Owner sees invoices/expenses for a horse in one place
- [ ] Invitation flow works for unregistered stable/trainer email
- [ ] Review can only be submitted for horse-specific verified relationship
- [ ] Relationship accept flow completes in minutes (invite → email → accept)

---

## Phase 1B — Hardening and pilot conversion

Target timeline: ~4–6 weeks after 1A pilot feedback.

### In scope

- Payment provider integration (real charging after trial)
- Partner commission tracking (10% first year, reference attribution)
- Active business rule for commission eligibility (login/usage threshold)
- Improved notifications (reminders, invoice due, booking upcoming)
- Document organization (folders/tags per horse)
- Stable roster view (all horses at stable)
- Trainer session logging with media (photo/video)
- Internal admin metrics page (see `metricsSpec.md`)
- Bug fixes and workflow polish from pilot users
- Continue stable and vet module build toward production gate

### Phase 1B acceptance criteria

- [ ] Owner converts from trial to paid subscription
- [ ] Business referral attribution correctly assigns first-used reference
- [ ] Commission calculated only on successful paid invoices
- [ ] Pilot stable + trainer actively use app weekly with at least 5 horses in flow

---

## Production launch requirements

**Do not open public production** until all four modules below are **fully implemented**, tested, and acceptance criteria pass.

| Module | Spec / reference | Launch bar |
|--------|------------------|------------|
| **User** | `businessPlan.md` Section 10.1, `userAndRoles.md`, `workplaceRelationship.md` | Signup, login, personal profile, multi-role navigation, workplace invitations, multi-business relationships, permissions |
| **Horse** | `businessPlan.md` Sections 4.1, 10.3 Horse module | Profile, ownership, timeline, documents, discovery, vaccination rules, location history |
| **Veterinary** | `businessPlan.md` Section 10.3 Vet module | Treatment records, medication plans, vaccination calendar, visit scheduling, clinical attachments, owner-visible scope |
| **Stable** | [`stableModule.md`](stableModule.md) | Full parity sections 1–9 (profile, roster, activity, team, facilities, feed, finance, communication, owner relationships) |

### Production acceptance criteria (cross-module)

- [ ] User can sign up, create personal profile, and operate horses and/or stable (and other role profiles) under one login
- [ ] Horse profile is canonical record shared across linked stable and vet with correct permissions
- [ ] Stable operates daily barn workflows at EquineM parity per `stableModule.md`
- [ ] Vet can link to horse, record treatments; owner sees allowed data on horse dashboard
- [ ] Owner pays subscription (post-trial); stable and vet accounts remain free
- [ ] Established relationships permanent; owner retains their horse data access after `ended` status
- [ ] Workplace invitation → **user** accept creates relationship; hierarchy on link; jobs assignable
- [ ] Same independent user can hold workplace relationships at two stables
- [ ] Horse-scoped reviews work for stable and vet verified relationships
- [ ] Owner sees only their horses' data across stable and vet views

### Trainer module

Required for **Phase 1 wedge pilots** but not listed in the production gate above. Trainer depth ships in parallel; expand production gate if product policy changes.

---

## Explicitly out of scope (post-production expansion)

### Product areas deferred
- Full marketplace and in-app horse deal execution
- Buy/sell transaction workflow (beyond price field on horse profile)
- Breeder / studfarm webshop suite (mare cards, semen portal — see `equinem.md` / `stableModule.md` §11)
- Transport operations module (beyond identity planning)
- Riding club module
- Racing/syndicate module
- Bloodline analytics
- Performance analytics engine
- Badge automation engine (earned badges rules)
- Public social feed / “Instagram for horses”
- News/content platform
- AI features (health summaries, report generation)

### Technical / ops deferred
- Elasticsearch/advanced search
- Multi-language launch
- Complex syndicate billing splits
- Automated dispute resolution for reviews
- Full GDPR/legal portal (baseline privacy only at launch)
- Redis, separate backend service (NestJS/Fastify), Python services

---

## Phase priority by role

| Role | Phase 1A wedge | Production gate |
|------|------------------|-----------------|
| Horse owner | High | Required |
| Stable | High | Required — `stableModule.md` |
| Veterinary | Build toward launch | Required |
| Trainer | High (wedge) | Parallel; not in gate |
| Transport | Deferred | Post-launch |
| Breeder | Deferred | Post-launch |

---

## Positioning (one line)

> Replace WhatsApp + spreadsheets + scattered invoices; give owners one transparent hub for their horse; give stables and vets free operational tools at EquineM parity and beyond.

---

## Decision gate before coding

Do not start Phase 1A build until `validationPlaybook.md` go/no-go criteria are met (minimum interview score threshold).

Do not open **public production** until **Production launch requirements** above are satisfied.
