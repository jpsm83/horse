# MVP Scope — Phase 1A / Phase 1B

This document defines what we build first, what comes immediately after, and what is explicitly out of scope for the initial release.

Source of truth:
- `businessPlan.md` — Section 0, Section 18 (Phase 1)
- `stack.md` — technical direction

---

## MVP goal

Become indispensable in daily horse operations for **owners, stables, and trainers**.

Success means real operational usage (schedules, messages, invoices, horse records), not vanity signups.

---

## Phase 1A — First shippable wedge (build this first)

Target timeline: ~8–10 weeks after validation (see `validationPlaybook.md`).

### In scope

#### Identity and accounts
- User signup/login
- Personal profile creation
- Create account types: **Owner**, **Stable**, **Trainer**, **Horse**
- Switch context between account types under one user login

#### Horse core
- Create horse profile (name, breed, age/sex, photos, basic details)
- Main owner assignment (payer of record)
- Horse dashboard/timeline (basic activity feed)

#### Relationships
- Search existing accounts (stable/trainer)
- Send relationship request (horse ↔ stable, horse ↔ trainer, owner ↔ business)
- Accept / decline requests
- Invite non-registered party by email (name + email minimum)
- Referral reference number on invitation emails (for Section 19 attribution)
- Rejection handling: no active connection, notify requester

#### Communication
- Open live chat between users (WhatsApp-style)
- In-app + push notifications for messages and relationship events

#### Booking (basic)
- Create booking request (owner → stable/trainer)
- Accept / decline booking
- Shared calendar view per horse and per business account
- Booking status notifications

#### Operations (basic)
- Create and view invoices per horse (stable/trainer → owner visibility)
- Owner expense summary per horse (total + invoice list)
- Upload/view basic documents (passport, contracts, PDFs/images)

#### Owner billing (MVP-ready)
- 30-day trial per horse
- Subscription logic: $99/horse/month (integration can be stubbed in 1A if needed, required in 1B)
- Main owner pays; co-owners can be linked without separate billing

#### Trust (minimal)
- Horse-scoped reviews only after verified relationship
- No badges engine in 1A (manual/trust flags only if needed)

### Phase 1A acceptance criteria

- [ ] Owner can add horse, invite stable, stable accepts, both see shared horse context
- [ ] Trainer can post session note visible on horse timeline for linked horse
- [ ] Owner and stable/trainer can chat without prior relationship (open chat)
- [ ] Owner can request booking; business can accept/decline
- [ ] Owner sees invoices/expenses for a horse in one place
- [ ] Invitation flow works for unregistered stable/trainer email
- [ ] Review can only be submitted for horse-specific verified relationship

---

## Phase 1B — Hardening and conversion (immediately after 1A)

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

### Phase 1B acceptance criteria

- [ ] Owner converts from trial to paid subscription
- [ ] Business referral attribution correctly assigns first-used reference
- [ ] Commission calculated only on successful paid invoices
- [ ] Pilot stable + trainer actively use app weekly with at least 5 horses in flow

---

## Explicitly out of scope (won’t do in Phase 1)

### Product areas deferred
- Full marketplace and in-app horse deal execution
- Buy/sell transaction workflow (beyond price field on horse profile)
- Vet module (medical records, vaccination schedules) — Phase 2
- Breeder module (lineage, fertility, contracts)
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
- Full GDPR/legal portal (baseline privacy only in MVP)

---

## Phase 1 user focus

| Role | Phase 1A priority |
|------|-------------------|
| Horse owner | High — payer, dashboard, expenses, chat, booking |
| Stable | High — roster, invoices, scheduling, owner invites |
| Trainer | High — sessions, scheduling, owner updates |
| Vet | Out of MVP — Phase 2 |
| Transport | Out of MVP — post wedge |
| Breeder | Out of MVP |

---

## MVP positioning (one line)

> Replace WhatsApp + spreadsheets + scattered invoices for stables/trainers and give owners one place to see everything about their horse.

---

## Decision gate before coding

Do not start Phase 1A build until `validationPlaybook.md` go/no-go criteria are met (minimum interview score threshold).
