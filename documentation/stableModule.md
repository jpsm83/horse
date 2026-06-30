# Stable Module — Feature Specification

Living document for planning, updating, and tracking **stable-facing** capabilities before and during build.

**Audience:** product, engineering, and GTM — use this file to add, remove, or reprioritize stable features before implementation starts on each area.

**Related docs:**
- [`equinem.md`](equinem.md) — competitor capability baseline (EquineM)
- [`businessPlan.md`](businessPlan.md) — vision, monetization, competitive positioning (Section 20), relationship rules
- [`mvpScope.md`](mvpScope.md) — build phases vs production launch gate
- [`userAndRoles.md`](userAndRoles.md) — identity; [`workplaceRelationship.md`](workplaceRelationship.md) — stable collaboration (User ↔ role profile)
- [`horseModule.md`](horseModule.md) — horse hub (owner view, discovery, timeline); complementary to stable roster sections here

---

## Product principles (stable)

1. **Free for stables** — stable accounts use operational features at no platform fee; horse owners pay per horse (see `businessPlan.md` Section 11).
2. **Transparency by design** — stables that join the platform commit to owner-visible horse data for horses they host. Owners see **only their own horses**, never other clients' horses.
3. **Collaborators are Users** — profile owner invites a User to collaborate at a **stable role profile** via `WorkplaceRelationship`; hierarchy on the link. See [`workplaceRelationship.md`](workplaceRelationship.md). **No `Business` model** — only `User` + role profiles.
4. **Multi-stable collaboration** — same User may collaborate at multiple stables; scheduling detects cross-stable conflicts.
5. **Relationship-first operations** — stable ↔ horse links require acceptance (typically after owner/stable communication). Once established, the relationship is **permanent** for history, owner access, and horse-scoped reviews — including after the horse leaves or during disputes.
6. **Ecosystem, not silo** — vets, trainers, and owners are independent accounts linked to the same horse; the stable is one actor in the network, not the sole tenant admin.
7. **EquineM parity + more** — match and exceed stable-centric tools (see parity sections below); add discovery, horse-scoped reviews, owner dashboard, referral commissions, and cross-provider connectivity EquineM does not offer.

---

## How to use this document

| Column / marker | Meaning |
|-----------------|--------|
| **Status: planned** | Agreed scope, not started |
| **Status: in progress** | Actively building |
| **Status: done** | Shipped in production |
| **Parity: EquineM** | Feature exists on competitor (see `equinem.md`) |
| **Beyond** | Differentiator vs EquineM |

Update status as work progresses. Add rows freely; keep IDs stable once referenced in tickets.

---

## 1. Stable profile and discovery

**Baseline API (shipped):** minimal create + discovery + public read — `POST /api/v1/stables`, `PATCH /api/v1/stables/:id/discovery`, `GET /api/v1/stables/:id`. See [`equus/documentation/stables.md`](../equus/documentation/stables.md). Full profile fields (photos, facilities, pricing tiers, search directory) remain below.

| ID | Feature | Parity | Status |
|----|---------|--------|--------|
| S-PROF-01 | Business profile: name, location, photos, facilities, description | Beyond | planned |
| S-PROF-02 | Specialties and disciplines (jumping, dressage, breeding, rehab, etc.) | Beyond | planned |
| S-PROF-03 | Services offered (boarding, training, lessons, rehab, etc.) | Beyond | planned |
| S-PROF-04 | Pricing tiers and boarding-slot availability | Beyond | planned |
| S-PROF-05 | Public/semi-public discovery page (search by location, discipline, services) | Beyond | planned |
| S-PROF-06 | Trust verification status and earned performance badges | Beyond | planned |
| S-PROF-07 | Horse-scoped reviews summary on profile (verified relationships only) | Beyond | planned |
| S-PROF-08 | Contact and inquiry (open chat + structured inquiries) | Beyond | planned |
| S-PROF-09 | Media gallery (facility photos, videos) | Parity | planned |

---

## 2. Horse roster and records

| ID | Feature | Parity | Status |
|----|---------|--------|--------|
| S-HORSE-01 | Horse roster: all horses currently hosted | Parity | planned |
| S-HORSE-02 | Historical roster: horses previously hosted | Parity | planned |
| S-HORSE-03 | Arrival / departure book-keeping | Parity | planned |
| S-HORSE-04 | Location history per horse | Parity | planned |
| S-HORSE-05 | Horse groups (e.g. link group to rider/groom) | Parity | planned |
| S-HORSE-06 | Default team per horse (rider, groom, farrier, etc.) | Parity | planned |
| S-HORSE-07 | Horse profile view: core details, photos, pedigree | Parity | planned |
| S-HORSE-08 | Import pedigree (e.g. HorseTelex integration) | Parity | planned |
| S-HORSE-09 | Owner info and ownership percentage on hosted horses | Parity | planned |
| S-HORSE-10 | Health records visible per relationship scope | Parity | planned |
| S-HORSE-11 | Transportation instructions | Parity | planned |
| S-HORSE-12 | Upload documents, photos, videos per horse | Parity | planned |
| S-HORSE-13 | URLs and external links per horse | Parity | planned |
| S-HORSE-14 | Digital tack room | Parity | planned |
| S-HORSE-15 | Vaccination rules / schedules per horse | Parity | planned |
| S-HORSE-16 | Invite/link horse via relationship request (existing or email invite) | Beyond | planned |
| S-HORSE-17 | Owner dashboard sync: stable updates visible on horse timeline | Beyond | planned |

---

## 3. Activity planning

| ID | Feature | Parity | Status |
|----|---------|--------|--------|
| S-ACT-01 | Activities and appointments | Parity | planned |
| S-ACT-02 | Mark activity / appointment completed | Parity | planned |
| S-ACT-03 | Assign activities to staff members | Parity | planned |
| S-ACT-04 | To-do's | Parity | planned |
| S-ACT-05 | Reminders and notifications | Parity | planned |
| S-ACT-06 | Announcements | Parity | planned |
| S-ACT-07 | Set order of activities | Parity | planned |
| S-ACT-08 | Training plans (reusable templates) | Parity | planned |
| S-ACT-09 | Treatment plans (reusable templates) | Parity | planned |
| S-ACT-10 | Customize activity types | Parity | planned |
| S-ACT-11 | Filter by horse, activity type, staff member | Parity | planned |
| S-ACT-12 | Group activities by staff member | Parity | planned |
| S-ACT-13 | Daily, weekly, and monthly views | Parity | planned |
| S-ACT-14 | Drag-and-drop planning interface | Parity | planned |
| S-ACT-15 | Track progress of work done during the day | Parity | planned |
| S-ACT-16 | Overview of all historic activities | Parity | planned |
| S-ACT-17 | Automated scheduling of vaccinations | Parity | planned |
| S-ACT-18 | Recurring activities | Parity | planned |
| S-ACT-19 | Customizable activity form input fields | Parity | planned |
| S-ACT-20 | Monthly overview per horse (activities + treatments) | Parity | planned |
| S-ACT-21 | Activity reports and horse development insight | Parity | planned |
| S-ACT-22 | Real-time status of progress and delays | Parity | planned |
| S-ACT-23 | Owner-visible activity feed on horse timeline | Beyond | planned |

---

## 4. Team management and collaborators

**Policy:** collaborators are **Users** (same signup as everyone). There is no business login. A stable is a **role profile** on the owning User's account. The profile owner invites a User; on accept, a **WorkplaceRelationship** links that User to the stable profile and the collaboration id is added to `Stable.collaborators[]`.

**Barn staff on hosted horses:** a collaborator may act on a horse when (1) active collaboration at this stable **and** (2) accepted horse ↔ stable `Relationship`. No separate groom↔horse link required. See [`workplaceRelationship.md`](workplaceRelationship.md).

| ID | Feature | Parity | Status |
|----|---------|--------|--------|
| S-TEAM-01 | All collaborators are Users (no shadow or stable-owned accounts) | Beyond | planned |
| S-TEAM-02 | Collaboration invitation → user accept/decline (`WorkplaceRelationship`) | Beyond | planned |
| S-TEAM-03 | Resend invitation after decline | Beyond | planned |
| S-TEAM-04 | Hierarchy on collaboration: admin, manager, staff (not on User) | Beyond | planned |
| S-TEAM-05 | Rich collaboration fields (title, description, permissions, dates, notes, etc.) | Beyond | planned |
| S-TEAM-06 | Role-based capabilities derived from hierarchy on that link | Parity | planned |
| S-TEAM-07 | Collaborator sees horses hosted by this stable (active collaboration + horse↔stable link) | Parity | planned |
| S-TEAM-08 | Teams and granular permission overrides per collaboration | Parity | planned |
| S-TEAM-09 | **Multi-stable:** same User, multiple collaborations | Beyond | planned |
| S-TEAM-10 | Cross-stable schedule conflict awareness | Beyond | planned |
| S-TEAM-11 | Assign activities/jobs to Users via active collaboration | Parity | planned |
| S-TEAM-12 | External providers (vet, farrier) as ecosystem profiles — direct horse link or barn path | Beyond | planned |
| S-TEAM-13 | Collaborator scheduling / availability per collaboration | Parity | planned |
| S-TEAM-14 | Track full/half day absence vs default schedule | Parity | planned |
| S-TEAM-15 | Monthly overview of collaborators at stable | Parity | planned |
| S-TEAM-16 | Historic availability overview | Parity | planned |
| S-TEAM-17 | Notifications on conflicts with horse scheduling | Parity | planned |
| S-TEAM-18 | User dashboard: owned profiles + collaborations + pending invites | Beyond | planned |

---

## 5. Facility planning

| ID | Feature | Parity | Status |
|----|---------|--------|--------|
| S-FAC-01 | Facility catalog (paddock, arena, walker, lunging ring, boxes, etc.) | Parity | planned |
| S-FAC-02 | Real-time occupancy insight | Parity | planned |
| S-FAC-03 | Online reservations by owners (web + mobile) | Parity | planned |
| S-FAC-04 | Opening/closing hours per facility | Parity | planned |
| S-FAC-05 | Max horses per facility at same time | Parity | planned |
| S-FAC-06 | Min/max reservation duration | Parity | planned |
| S-FAC-07 | Max days ahead for booking | Parity | planned |
| S-FAC-08 | Lessons and service-type reservations | Parity | planned |
| S-FAC-09 | Owner booking requests with accept/decline workflow | Beyond | planned |

---

## 6. Feed and supplements

| ID | Feature | Parity | Status |
|----|---------|--------|--------|
| S-FEED-01 | Feed schedule per horse | Parity | planned |
| S-FEED-02 | Feed types and default quantities | Parity | planned |
| S-FEED-03 | Supplements in schedule | Parity | planned |
| S-FEED-04 | Barn-visible feed overview for staff | Parity | planned |
| S-FEED-05 | Adjust schedule from anywhere | Parity | planned |
| S-FEED-06 | Automatic historical log of what each horse received | Parity | planned |
| S-FEED-07 | Feed inventory tracking | Parity | planned |
| S-FEED-08 | Filter by horse, horse group, owner | Parity | planned |
| S-FEED-09 | Monthly feed overview by horse | Parity | planned |
| S-FEED-10 | Owner-visible feed history on horse profile | Beyond | planned |

---

## 7. Financial administration

| ID | Feature | Parity | Status |
|----|---------|--------|--------|
| S-FIN-01 | Track billable services by horse / owner | Parity | planned |
| S-FIN-02 | Track billable activities by horse / owner | Parity | planned |
| S-FIN-03 | Pricing of services | Parity | planned |
| S-FIN-04 | Pricing of activities | Parity | planned |
| S-FIN-05 | Create and send invoices | Parity | planned |
| S-FIN-06 | Track invoice payments | Parity | planned |
| S-FIN-07 | Auto-fill invoices from activities/services | Parity | planned |
| S-FIN-08 | Track costs and service totals | Parity | planned |
| S-FIN-09 | Record expenses (feed, vet, maintenance) | Parity | planned |
| S-FIN-10 | Financial performance by horse, service, and stable overall | Parity | planned |
| S-FIN-11 | Account balances per owner/contact | Parity | planned |
| S-FIN-12 | Financial reports for analysis and planning | Parity | planned |
| S-FIN-13 | Bookkeeping integrations (Yuki, Moneybird, Exact Online — target list) | Parity | planned |
| S-FIN-14 | Owner expense dashboard: all stable invoices in one place | Beyond | planned |
| S-FIN-15 | Partner referral commission on owner subscriptions (Section 19) | Beyond | planned |
| S-FIN-16 | Advanced analytics: facility occupancy insight and revenue forecasting | Parity | planned |

---

## 8. Communication and reports

| ID | Feature | Parity | Status |
|----|---------|--------|--------|
| S-COM-01 | Default reports per module | Parity | planned |
| S-COM-02 | Custom report builder | Parity | planned |
| S-COM-03 | Custom email templates | Parity | planned |
| S-COM-04 | Send report to owner via email | Parity | planned |
| S-COM-05 | Historical reporting | Parity | planned |
| S-COM-06 | Stable announcements and updates | Parity | planned |
| S-COM-07 | Open live chat with owners, staff, and providers (WhatsApp-style) | Beyond | planned |
| S-COM-08 | Booking and relationship notifications | Beyond | planned |
| S-COM-09 | Owner communication portal (timeline + messages + documents) | Beyond | planned |

---

## 9. Owner relationship, transparency, and trust

| ID | Feature | Parity | Status |
|----|---------|--------|--------|
| S-REL-01 | Send relationship request (horse ↔ stable) | Beyond | planned |
| S-REL-02 | Email invitation for unregistered owner/stable | Beyond | planned |
| S-REL-03 | Accept / decline pending request | Beyond | planned |
| S-REL-04 | Resend request after mistaken decline | Beyond | planned |
| S-REL-05 | Established relationship is permanent (history never deleted) | Beyond | planned |
| S-REL-06 | Owner retains read access to their horse data after leave or dispute | Beyond | planned |
| S-REL-07 | Horse-scoped review/rating after verified relationship (bidirectional: stable ↔ horse/owner) | Beyond | planned |
| S-REL-08 | Reviewee can respond to horse-scoped reviews | Beyond | planned |
| S-REL-09 | Referral reference on invitations (commission attribution) | Beyond | planned |

---

## 10. Beyond EquineM (stable differentiators)

Capabilities EquineM does **not** center on stable-as-tenant:

| ID | Feature | Status |
|----|---------|--------|
| S-DIFF-01 | Independent vet/trainer accounts linked to same horse (network, not org contacts) | planned |
| S-DIFF-02 | Owner-paid model: stable free; owner subscribes for full horse hub | planned |
| S-DIFF-03 | Portable horse record across stables and providers | planned |
| S-DIFF-04 | Discovery: stable found by owners searching the ecosystem | planned |
| S-DIFF-05 | Horse-scoped verified reviews (not anonymous wall) | planned |
| S-DIFF-06 | Owner connectivity with other owners (where product policy allows) | planned |
| S-DIFF-07 | Unified owner dashboard across stable, vet, trainer invoices and records | planned |
| S-DIFF-08 | Browse-first signup: users explore before creating stable profile | planned |
| S-DIFF-09 | Multi-role single login (user can be stable owner + horse owner + trainer) | planned |

---

## 11. Production readiness (stable slice)

The stable module is **production-ready** when every feature marked **required for launch** in Sections 1–9 above is `done` and acceptance criteria pass.

Cross-module production gate (all must be ready together): see [`mvpScope.md`](mvpScope.md) — **Production launch requirements** (User, Horse, Veterinary, Stable modules).

### Stable launch acceptance (summary)

- [ ] Stable can create profile, roster horses, and operate daily care/activity/feed/facility/finance workflows at EquineM parity
- [ ] Advanced analytics (occupancy, revenue forecasting) available as part of stable financial/operations tooling (S-FIN-16)
- [ ] Stable can invite/link owners; relationship accept flow completes in minutes
- [ ] Owner sees only their horses' stable data on owner dashboard
- [ ] Established relationships retain history and owner access after horse departs
- [ ] Horse-scoped reviews work for verified stable relationships
- [ ] Collaboration invitation → user accept; hierarchy on `WorkplaceRelationship`; only User decides accept/decline
- [ ] Same User, two active collaborations at different stables

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-30 | Removed post-launch / out-of-scope section; analytics promoted to S-FIN-16 (required for stable) |
| 2026-06-29 | Collaborators as Users; WorkplaceRelationship + Stable.collaborators; barn staff horse access rules |
| 2026-06-29 | Staff policy: invite/accept; multi-stable employment |
| 2026-06-29 | Initial specification from `equinem.md` parity + business plan stable module |
