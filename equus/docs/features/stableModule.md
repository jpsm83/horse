# Stable Module — Feature Specification

Living document for planning, updating, and tracking **stable-facing** capabilities before and during build.

**Audience:** product, engineering, and GTM — use this file to add, remove, or reprioritize stable features before implementation starts on each area.

**Product is source of truth:** [`equus/docs/product/businessPlan.md`](../product/businessPlan.md), [`monetization.md`](../product/monetization.md) (prices — do not copy here), [`mvpScope.md`](../product/mvpScope.md).

**Related:** [`entitySubscription.md`](entitySubscription.md), [`horseModule.md`](horseModule.md) (owner **display**), [`userModule.md`](userModule.md), [`workplaceRelationship.md`](workplaceRelationship.md), [`ownershipTransfer.md`](ownershipTransfer.md), [`chat.md`](chat.md), [`favorites.md`](favorites.md).

---

## Product principles (stable)

1. **Stable pays SaaS** — the owning User is the Equus customer. Horse owners are not billed. Numbers: [`../product/monetization.md`](../product/monetization.md). States: [`entitySubscription.md`](entitySubscription.md).
2. **Ops writes live here** — whiteboard, feed, invoices, roster. The horse page **displays** (Planning / Documents); it does not run the yard.
3. **Good standing required to write** — write-lock if the subscription lapses. **Do not delete** history; owners still **see** saved events and invoices.
4. **Transparency** — owners see **only their horses**. Saved horse-attached data remains after leave or lapse.
5. **Collaborators are Users** — `WorkplaceRelationship`. No `Business` login. Until vet/trainer **modules** ship, those people collaborate as Users.
6. **Two hosting paths** — owner invites stable **or** stable creates a boarded horse (waiting-transfer + nags). See [`horseModule.md`](horseModule.md) H-OWN-08.
7. **Roster feeds the meter** — current hosted + waiting-transfer. Price on the entity is overridable; adding a horse does not auto-charge.
8. **EquineM parity + graph** — match barn ops; exceed with independent accounts, discovery, horse-scoped reviews, free owner Hub.
9. **Stable list default = mine** (owned or collaborating). Discovery and Favorites are filters.

---

## How to use this document

| Column / marker | Meaning |
|-----------------|--------|
| **Status: planned** | Agreed scope, not started |
| **Status: in progress** | Actively building |
| **Status: done** | Shipped in production |
| **Parity: EquineM** | Feature exists on competitor (see [`equus/docs/product/benchMarket/webapps.md`](../product/benchMarket/webapps.md#12-equinem)) |
| **Beyond** | Differentiator vs EquineM |

Update status as work progresses. Add rows freely; keep IDs stable once referenced in tickets.

---

## 1. Stable profile and discovery

**Baseline API (shipped):** minimal create + discovery + public read — `POST /api/v1/stables`, `PATCH /api/v1/stables/:id/discovery`, `GET /api/v1/stables/:id`. See [equus/docs/engineering/stables.md](../engineering/stables.md). Full profile fields (photos, facilities, pricing tiers, search directory) remain below.

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
| S-HORSE-16 | Accept owner hosting invite; email invite for unregistered owner | Beyond | planned |
| S-HORSE-17 | Emit events/invoices that **display** on horse Planning / Documents | Beyond | planned |
| S-HORSE-18 | Create boarded horse (owner email required) + waiting-transfer | Beyond | planned |
| S-LIST-01 | Stable index default = **mine**; discovery + Favorites filters | Beyond | planned |

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
| S-ACT-23 | Entity events appear on horse **Planning** (owner cannot edit them; reply = chat) | Beyond | planned |

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
| S-TEAM-18 | Pending workplace invites appear on **home inbox** ([`myGraph.md`](myGraph.md)) | Beyond | planned |

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
| S-FEED-10 | Feed history visible on horse Planning (owner display) | Beyond | planned |

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
| S-FIN-14 | Invoices **created here**; shown on horse **Documents → invoices** | Beyond | planned |
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
| S-COM-09 | Chat with owners ([`chat.md`](chat.md)); horse display is Hub/Planning/Documents | Beyond | planned |

---

## 9. Owner relationship, transparency, and trust

| ID | Feature | Parity | Status |
|----|---------|--------|--------|
| S-REL-01 | Receive owner hosting invite; accept/decline | Beyond | planned |
| S-REL-02 | Email invitation for unregistered owner | Beyond | planned |
| S-REL-03 | Accept / decline pending request | Beyond | planned |
| S-REL-04 | Resend after mistaken decline | Beyond | planned |
| S-REL-05 | Established relationship permanent (history never deleted) | Beyond | planned |
| S-REL-06 | Owner keeps **visible** saved horse data after leave, dispute, or write-lock | Beyond | planned |
| S-REL-07 | Horse-scoped reviews (bidirectional) | Beyond | planned |
| S-REL-08 | Reviewee can respond | Beyond | planned |

---

## 10. Beyond EquineM (stable differentiators)

Capabilities EquineM does **not** center on stable-as-tenant:

| ID | Feature | Status |
|----|---------|--------|
| S-DIFF-01 | Independent vet/trainer accounts on the same horse (post-launch as own SaaS; at launch = Users + collab) | planned |
| S-DIFF-03 | Portable horse record; history remains if this stable lapses | planned |
| S-DIFF-04 | Discovery: stable found by owners searching the ecosystem | planned |
| S-DIFF-05 | Horse-scoped verified reviews (not anonymous wall) | planned |
| S-DIFF-06 | Owner connectivity with other owners (where product policy allows) | planned |
| S-DIFF-07 | Unified owner dashboard across stable, vet, trainer invoices and records | planned |
| S-DIFF-08 | Browse-first signup: users explore before creating stable profile | planned |
| S-DIFF-09 | Multi-role single login (user can be stable owner + horse owner + trainer) | planned |

---

## 11. Production readiness (stable slice)

The stable module is **production-ready** when every feature marked **required for launch** in Sections 1–9 above is `done` and acceptance criteria pass.

Cross-module production gate: [`mvpScope.md`](../product/mvpScope.md) — **User + Horse + Stable** (Veterinary is **not** in the gate).

### Stable launch acceptance (summary)

- [ ] Stable can create profile, roster horses, and operate daily care/activity/feed/facility/finance workflows at EquineM parity
- [ ] Advanced analytics (occupancy, revenue forecasting) available as part of stable financial/operations tooling (S-FIN-16)
- [ ] Owner invite **and** barn-created waiting-transfer; accept flow in minutes
- [ ] Entity subscription in good standing for writes; write-lock does not hide owner history
- [ ] Owner sees only their horses; invoices/events display on horse Documents/Planning
- [ ] Established relationships retain history and owner access after horse departs
- [ ] Horse-scoped reviews work for verified stable relationships
- [ ] Collaboration invitation → user accept; hierarchy on `WorkplaceRelationship`; only User decides accept/decline
- [ ] Same User, two active collaborations at different stables

---

## 12. First delivery — market backlog (stable SaaS)

**Priority for first delivery:** stable SaaS (roster, tasks, health, feed, docs, finance, facilities) feeding horse **Planning / Documents** (Hub stays social).

Full extraction and competitor mapping: [equus/docs/product/firstDeliveryCompetitiveBacklog.md](../product/firstDeliveryCompetitiveBacklog.md) §B. Source detail: [`equus/docs/product/benchMarket/webapps.md`](../product/benchMarket/webapps.md) (Equicty, HippoVibe, Equestrian App StallPros). EquineM parity remains in Sections 1–9.

These rows **add** market-derived gaps not already covered as named IDs above. They do **not** replace Sections 1–11.

| ID | Feature | Market source | Status |
|----|---------|---------------|--------|
| S-FD-01 | Stall assignment UI (boxes 1–N) with horse + emergency contacts | Equestrian App StallPros | planned |
| S-FD-02 | Multiple barns / turnouts under one stable profile | Equestrian App | planned |
| S-FD-03 | Digital whiteboard daily board: real-time task list visible to whole team (mobile + web) | HippoVibe | planned |
| S-FD-04 | Bulk move / copy / delete of planned tasks | Equicty interactive planning | planned |
| S-FD-05 | Staff schedule (roster of who works when) alongside horse activities | HippoVibe staff schedule | planned |
| S-FD-06 | Field-level access rights (restrict medical and financial fields per collaborator) | HippoVibe, Equicty | planned |
| S-FD-07 | Collaborator admin fields: title, contracts, flight/travel docs, notes | Equicty team management | planned |
| S-FD-08 | Sub-teams linked to horse groups | Equicty | planned |
| S-FD-09 | Per-horse document playlists / folders (videos, X-rays, scans, invoices) | HippoVibe | planned |
| S-FD-10 | Share horse information pack from stable roster to owner or buyer | HippoVibe | planned |
| S-FD-11 | HorseTag QR printable for stalls → horse Hub | Equestrian App | planned |
| S-FD-12 | Stable contact CRM (owners, prospects, providers) | Equicty CRM | planned |
| S-FD-13 | Online invoice payment status / collection | Equicty Equclub payments | planned |
| S-FD-14 | Peppol / UBL e-invoicing option for EU stables | Equicty Peppol | planned |
| S-FD-15 | Embed stable calendar on external website | Equestrian App Platinum | planned |
| S-FD-16 | Farrier / bodywork visit documentation written into hosted horse journal | Equestrian App | planned |
| S-FD-17 | Light leasing: schedule lease days for hosted horses | Equestrian App | planned |
| S-FD-18 | Lesson / arena booking subset when stable offers lessons (member levels, instructor assign, packages) | Equicty Equclub | planned |
| S-FD-19 | Competition / show plan shared with team and owners (classes, times, related expenses) | Equicty Competition add-on, HippoVibe | planned |
| S-FD-20 | Mobile finance capture: log income/expense per horse from phone | HippoVibe | planned |

**Deferred from market (documented, not first delivery):** Smart Stable Board hardware (Equicty); Hoofy AI (Equicty); full breeding/stud module (Equicty/EquineM) unless ICP is stud; paid search boost ads (Equestrian App); Happie-style metabolic pasture OS.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-08-16 | Align with product: entity pays; two hosting paths; write-lock ≠ delete; **removed** free-stable, owner-pays, commission rows |
| 2026-07-24 | §12 First delivery market backlog (stable SaaS) from `equus/docs/product/benchMarket/webapps.md` / `equus/docs/product/firstDeliveryCompetitiveBacklog.md` |
| 2026-06-30 | Removed post-launch / out-of-scope section; analytics promoted to S-FIN-16 (required for stable) |
| 2026-06-29 | Collaborators as Users; WorkplaceRelationship + Stable.collaborators; barn staff horse access rules |
| 2026-06-29 | Staff policy: invite/accept; multi-stable employment |
| 2026-06-29 | Initial specification from EquineM parity (now in `equus/docs/product/benchMarket/webapps.md` §12) + business plan stable module |
