# First Delivery — Competitive Feature Backlog

> **Purpose:** Extract from [`equus/docs/product/benchMarket/webapps.md`](benchMarket/webapps.md) every competitor capability relevant to Equus **first delivery** priorities: (1) **user + horse details for social interaction**, and (2) **stable SaaS**.  
> **Rule:** This document **adds** market-derived scope. It does **not** remove or replace anything already defined in Equus module specs.  
> **Policy:** Social features follow `businessPlan.md` Section 15 — **utility first, social second** (not an open Instagram-style network).  
> **Research date:** July 2026 (from competitive benchmark).

**Related Equus specs (append targets):**
- [equus/docs/features/userModule.md](../features/userModule.md) — § First delivery market backlog
- [equus/docs/features/horseModule.md](../features/horseModule.md) — § First delivery market backlog
- [equus/docs/features/stableModule.md](../features/stableModule.md) — § First delivery market backlog
- [`mvpScope.md`](mvpScope.md) — Phase 1A / first delivery priority
- Full competitor detail: [`equus/docs/product/benchMarket/webapps.md`](benchMarket/webapps.md)

---

## First delivery focus (locked product intent)

| Priority | What we ship first | Why (market signal) |
|----------|--------------------|---------------------|
| **A — Social identity & horse public surface** | Rich user cards + rich horse profiles that support discovery, sharing, reviews, care-network visibility, and sale-ready history | My Cheval, Happie, Equestrian App, Equilab, ehorses, Ridely |
| **B — Stable SaaS** | Multi-user barn ops: roster, tasks, health, feed, docs, finance, facilities, owner transparency | Equicty, HippoVibe, Equestrian App (StallPros), EquineM parity already in `equus/docs/features/stableModule.md` |

**Explicitly later (still catalogued in webapps.md, not first delivery):** FEI compliance rebuild, BHA racing admin, BHS membership/insurance, full edtech video library (Ridely), GPS gait AI as primary product, fructan/laminitis OS as primary product, Smart Stable Board hardware.

---

## A. User & horse details for social interaction

### A.1 User identity & public card (social surface)

Sources: Equestrian App, Equilab, Ridely, My Cheval, Happie, BHS membership cards, Equus `userModule` (already has public profile).

| Market feature | Competitor(s) | Equus implication for first delivery |
|----------------|---------------|--------------------------------------|
| Avatar / profile photo | All consumer apps | Keep & strengthen public card image |
| Display name / username / bio | Equus, Equilab, Equestrian App | Username + bio on public card; entity-first discovery (no people search) remains |
| Preferred language | Equus, Equilab (12 langs) | Keep `preferredLanguage` |
| Profile visibility controls | Equus, Happie share modes | Keep `profileVisibility` + DM preference |
| Business vs individual display name | Equus `userType` | Keep businessName on public cards |
| Connect / follow friends | Equilab, My Cheval, Equestrian App | Optional utility: “connect” only when it serves horse care or booking — not a generic social graph |
| Allow others to journal on shared horse | Equestrian App | Aligns with Relationship permissions + WorkplaceRelationship |
| Barn Chat / group messaging | Equestrian App | Open chat (already Phase 1A) + horse/stable context threads |
| Expert-moderated topic groups | Ridely | **Defer** — edtech community, not first delivery |
| Challenges / leaderboards / achievements | Equilab, Ridely, My Cheval | **Defer** gamification unless used for trust badges later |
| In-app ads / brand offers | Equilab, Happie Marketing Cloud, Equestrian App | **Defer** monetization ads |

### A.2 Horse profile details that enable social & discovery

Sources: My Cheval, Happie, Equestrian App, ehorses listings, HippoVibe share packs, Equicty horse CV, Equus `horseModule` (many already done).

| Market feature | Competitor(s) | Equus implication for first delivery |
|----------------|---------------|--------------------------------------|
| Core identity (name, breed, sex, DOB, color, height, marks) | All CRMs + ehorses | **Keep** (H-PROF-*) |
| Passport, microchip, registry | My Cheval, Happie, FEI, Equicty | **Keep** |
| Pedigree / bloodline | My Cheval, HippoVibe, Equicty, ehorses | **Keep**; Horsetelex sync = later (Equicty) |
| Equipment sizes (girth, bit, etc.) | My Cheval | **Add** as profile fields for practical sharing with tack/farrier |
| Primary + multi discipline | Equus, ehorses filters | **Keep** |
| Description / notes / about | All | **Keep** |
| Photo + video gallery | All; ehorses up to 20 images + 4 videos | **Keep** Media tab; ensure public Hub can show gallery subset |
| Documents (passport, Coggins, certificates) | Equestrian App, Equicty, My Cheval | **Keep** Documents tab; permission-scoped access |
| Estimated value / sale status / asking price | Equus, ehorses | **Keep** Admin sale settings |
| “Carfax for horses” — care history on sale listing | Equestrian App | **Add** — public sale card shows verified health/farrier history summary when for sale |
| Share horse pack (age, pedigree, videos, results links) | HippoVibe | **Add** — shareable horse information pack for buyers/owners |
| Share modes: read-only vs full access | Happie | **Add** — map to Relationship / collaborator permission levels |
| Profile transfer / ownership handover | My Cheval, Equestrian App, Equus OwnershipTransfer | **Keep** OwnershipTransfer |
| HorseTag QR / scan for quick lookup | Equestrian App | **Add** for barn + social discovery of horse Hub |
| Weight tracker / body values | Equestrian App, Happie | **Add** light body metrics on horse (social/care context) |
| Weather / blanket / rug recommendations | My Cheval, Equestrian App, Happie web tools | **Defer** or light Hub widget after core |
| Fructan / pollen / PPID diaries | Happie | **Defer** (health OS depth) |
| FEI passport barcode / temps | FEI HorseApp | **Defer** (compliance integration later) |

### A.3 Horse Hub / social interaction surfaces

Sources: Equus Hub tab, Equestrian App journal+feed, Equilab home feed, My Cheval sharing, Ridely activity journal, businessPlan §15.

| Market feature | Competitor(s) | Equus implication for first delivery |
|----------------|---------------|--------------------------------------|
| Public horse Hub / dashboard | Equus Hub | **Keep** — expand with identity summary, media, pedigree, ownership, discovery |
| Activity journal / timeline posts | Equestrian App, Ridely, My Cheval | **Add** — horse Hub timeline (H-DASH-*) with provider-sourced entries |
| News feed of horse activity for caregivers | Equestrian App | **Add** — relationship-scoped feed (not global Instagram) |
| Community journal / social posts | Equestrian App, Equilab groups | Only when tied to horse/stable context; **no** public social feed (mvpScope deferral stands) |
| Injury photo capture for vet | Equestrian App | **Add** via Media + timeline note |
| Multi-party permissions (owner, trainer, vet, farrier, leasee) | Equestrian App, Happie, Equicty | **Keep** Relationship + WorkplaceRelationship; surface on Connect |
| Horse-scoped verified reviews | Equus, businessPlan §15.3 | **Keep** H-REL-07/08 |
| Structured inquiry from discovery | Equus | **Keep** H-COM-03 |
| Open live chat | Equus Phase 1A | **Keep** |
| Live GPS ride share / RideSafe | Equilab, Ridely, My Cheval | **Defer** (ride product, not first delivery) |
| Training video library / AI coach | Ridely | **Defer** |

### A.4 Sale / marketplace adjacency (social proof for horse details)

Sources: ehorses, Equestrian App horses-for-sale, HippoVibe share packs, Equicty website sync.

| Market feature | Competitor(s) | Equus implication for first delivery |
|----------------|---------------|--------------------------------------|
| Rich listing fields (breed, age, height, colour, discipline, price, location, pedigree, media) | ehorses | Align public sale view with these filters/fields |
| Watchlist / saved search | ehorses | **Defer** full marketplace; optional “interested” later |
| Commission-free listing | ehorses | Pricing policy later |
| Website sync of horse catalog | Equicty | **Defer** |
| Job board / property / tack classifieds | ehorses | **Defer** |

---

## B. Stable SaaS features (first delivery)

Extracted from **Equicty (Equstable/Equclub)**, **HippoVibe**, **Equestrian App (StallPros)**, and cross-checked with existing [equus/docs/features/stableModule.md](../features/stableModule.md) / EquineM in [`equus/docs/product/benchMarket/webapps.md`](benchMarket/webapps.md#12-equinem). Items already in `equus/docs/features/stableModule.md` are marked **already specified**; new market gaps are marked **add**.

### B.1 Stable profile & discovery

| Market feature | Competitor(s) | Status vs Equus |
|----------------|---------------|-----------------|
| Name, location, photos, facilities, description | Equicty, HippoVibe, Equestrian App | **Already** S-PROF-01 |
| Specialties / disciplines | Market + Equus | **Already** S-PROF-02 |
| Services offered (boarding, training, lessons, rehab) | All yard SaaS | **Already** S-PROF-03 |
| Pricing tiers / boarding availability | Equestrian App, Equicty Equclub | **Already** S-PROF-04 |
| Public discovery page | Equus beyond EquineM | **Already** S-PROF-05 |
| Media gallery | EquineM / Equicty | **Already** S-PROF-09 |
| Contact / inquiry / chat | Equus | **Already** S-PROF-08 |
| Trust badges / reviews summary | Equus | **Already** S-PROF-06/07 |
| Embed calendar on website | Equestrian App Platinum | **Add** |
| Seen-first in search (paid boost) | Equestrian App Platinum | **Defer** ads |

### B.2 Horse roster & records (barn view)

| Market feature | Competitor(s) | Status vs Equus |
|----------------|---------------|-----------------|
| Current + historical roster | Equicty, HippoVibe, EquineM | **Already** S-HORSE-01/02 |
| Arrival / departure bookkeeping | EquineM | **Already** S-HORSE-03 |
| Location history | EquineM | **Already** S-HORSE-04 |
| Horse groups / filters (discipline, mares, foals…) | HippoVibe, Equicty | **Already** S-HORSE-05 |
| Default team per horse | EquineM | **Already** S-HORSE-06 |
| Pedigree + Horsetelex sync | Equicty | **Already** S-HORSE-08 (integration later) |
| Owner % / ownership info | Equicty, HippoVibe | **Already** S-HORSE-09 |
| Health records scoped by relationship | All | **Already** S-HORSE-10 |
| Documents, photos, videos, X-rays, invoices | HippoVibe, Equicty | **Already** S-HORSE-12 |
| Playlists / folder structure per horse | HippoVibe | **Add** folder/playlist UX detail |
| Digital tack room | EquineM, Equestrian App | **Already** S-HORSE-14 |
| Vaccination schedules | All | **Already** S-HORSE-15 |
| Share horse info pack with owners/buyers | HippoVibe | **Add** (same as horse social share pack) |
| Stall assignment (1–100+ stalls) | Equestrian App StallPros | **Add** |
| Multiple barns and turnouts | Equestrian App | **Add** |
| Emergency contacts per stall/horse | Equestrian App | **Add** |
| HorseTag QR in barn | Equestrian App | **Add** |
| Website horse catalog sync | Equicty | **Defer** |

### B.3 Daily ops / activity planning (whiteboard replacement)

| Market feature | Competitor(s) | Status vs Equus |
|----------------|---------------|-----------------|
| Digital task lists / daily plan, real-time team visibility | HippoVibe, Equicty | **Already** S-ACT-* |
| Drag-and-drop planning | Equicty, EquineM | **Already** S-ACT-14 |
| Bulk move/copy/delete tasks | Equicty | **Add** |
| Assign tasks to staff / groups | Equicty, HippoVibe, EquineM | **Already** S-ACT-03 |
| Staff schedule | HippoVibe | **Add** (complements S-TEAM-13) |
| Training statistics from past work | HippoVibe | **Already** S-ACT-21 |
| Shared calendar for shows, lessons, events | HippoVibe, Equicty Competition add-on | **Already** S-ACT-01 + competition add-on |
| Mark completed / progress / delays | EquineM, Equicty | **Already** S-ACT-02/15/22 |
| Recurring activities + vaccination auto-schedule | EquineM, Equicty | **Already** S-ACT-17/18 |
| Training / treatment plan templates | EquineM | **Already** S-ACT-08/09 |
| Customize activity types / form fields | EquineM | **Already** S-ACT-10/19 |
| Filter by horse, type, staff; daily/weekly/monthly | EquineM | **Already** S-ACT-11–13 |
| Owner-visible activity feed | Equus Beyond | **Already** S-ACT-23 |
| Announcements | EquineM | **Already** S-ACT-06 |
| Smart Stable Board (32″ hardware) | Equicty | **Defer** hardware |
| Hoofy AI stable assistant | Equicty | **Defer** AI (mvpScope) |

### B.4 Team / collaborators

| Market feature | Competitor(s) | Status vs Equus |
|----------------|---------------|-----------------|
| Unlimited users / invite team | HippoVibe, Equicty | **Already** S-TEAM-* + WorkplaceRelationship |
| Individual access rights (medical/financial restricted) | HippoVibe, Equicty | **Already** hierarchy + **Add** field-level sensitive scopes |
| Staff personal details, contracts, docs | Equicty | **Add** collaborator admin fields |
| Sub-teams linked to horse groups | Equicty | **Add** |
| Native language per user | Equicty | Align with user `preferredLanguage` |
| Multi-stable collaboration + conflict detection | Equus Beyond | **Already** S-TEAM-09/10 |
| Farrier/bodywork visit docs into horse journal | Equestrian App | **Add** (ecosystem provider write-to-horse) |
| Leasing / lease-day scheduling | Equestrian App | **Add** light lease scheduling |

### B.5 Facilities

| Market feature | Competitor(s) | Status vs Equus |
|----------------|---------------|-----------------|
| Facility catalog + occupancy | EquineM, Equicty Equclub arenas | **Already** S-FAC-* |
| Online reservations by owners | EquineM | **Already** S-FAC-03 |
| Arena slot reservations / lesson calendar | Equicty Equclub | **Add** riding-club-style lesson slots when stable offers lessons |
| Horse assignment to lessons by rideability | Equicty Equclub | **Add** |
| Max horses / duration / hours rules | EquineM | **Already** S-FAC-04–07 |

### B.6 Feed & supplements

| Market feature | Competitor(s) | Status vs Equus |
|----------------|---------------|-----------------|
| Feed plans with easy updates | HippoVibe, Happie, EquineM | **Already** S-FEED-* |
| Customizable feed products | HippoVibe | **Already** S-FEED-02 |
| Owner-visible feed history | Equus Beyond | **Already** S-FEED-10 |
| Inventory tracking | EquineM | **Already** S-FEED-07 |

### B.7 Finance & admin

| Market feature | Competitor(s) | Status vs Equus |
|----------------|---------------|-----------------|
| Income & expenses per horse | HippoVibe, Equicty, EquineM | **Already** S-FIN-* |
| Competition winnings / vet invoices / training costs | HippoVibe | Cover under expense categories |
| Flexible & recurring invoices to owners | Equicty, EquineM | **Already** S-FIN-05 |
| Capture billable items from planning → invoice | Equicty, EquineM | **Already** S-FIN-07 |
| CRM / contact management | Equicty | **Add** stable contact CRM |
| Peppol / UBL e-invoicing | Equicty | **Add** for EU/Belgium markets (compliance) |
| Bookkeeping integrations | EquineM | **Already** S-FIN-13 |
| Owner expense dashboard | Equus Beyond | **Already** S-FIN-14 |
| Payment collection (Stripe boarding) | Ridely partners / Equclub | **Add** online payment status for invoices |
| Rescue / nonprofit tools | Equestrian App Platinum | **Defer** niche |

### B.8 Equclub / lessons (if stable offers teaching)

| Market feature | Competitor(s) | Status vs Equus |
|----------------|---------------|-----------------|
| Member management by riding level | Equicty Equclub | **Add** when riding-club/stable lessons in scope |
| Parent booking for children | Equicty Equclub | **Add** |
| Instructor permissions | Equicty Equclub | Map to WorkplaceRelationship |
| Lesson packages / subscriptions e-commerce | Equicty Equclub | **Add** |
| Member self-service portal | Equicty Equclub | **Add** |
| Auto notifications (cancellations, freed spots) | Equicty Equclub | **Add** |

> Riding club as a separate entity remains in `equus/docs/engineering/entities/riding-clubs.md`; first delivery may ship **lesson-capable stable** subset only if product chooses.

### B.9 Breeding (pro stables / studs)

| Market feature | Competitor(s) | Status vs Equus |
|----------------|---------------|-----------------|
| Mare cards, cycles, AI, embryo, foaling | Equicty Breeding, EquineM | **Defer** to post-first-delivery (mvpScope / EquineM stud in `equus/docs/product/benchMarket/webapps.md` §12) unless ICP is stud |
| Semen inventory / shipments | Equicty | **Defer** |

### B.10 Owner transparency (stable ↔ social horse Hub)

| Market feature | Competitor(s) | Status vs Equus |
|----------------|---------------|-----------------|
| Owner sees only their horses | Equus principle | **Already** |
| Stable updates on horse timeline | Equus Beyond | **Already** S-HORSE-17 / S-ACT-23 |
| Reports emailed to owner | EquineM | **Already** S-COM-04 |
| Owner communication portal | Equus | **Already** S-COM-09 |
| Bidirectional horse-scoped reviews | Equus | **Already** S-REL-07/08 |

---

## C. Competitor → Equus mapping (who to beat on what)

| Competitor | Steal for first delivery | Do not rebuild |
|------------|--------------------------|----------------|
| **Equicty** | Drag-drop ops, invoicing from tasks, breeding later, Peppol, Equclub lessons | Hardware board, Hoofy AI (yet) |
| **HippoVibe** | Simple whiteboard + share packs + per-horse finance + unlimited users | Celebrity sport-only positioning |
| **Equestrian App** | Multi-party journal, StallPros stalls, Carfax sale history, HorseTag, farrier journal | Dated UX; sprawling free tiers |
| **My Cheval** | Equipment sizes, rug/tides later, ownership transfer UX, expense+calendar cohesion | Inconsistent free/IAP messaging |
| **Happie** | Share read/full access, unlimited horses free UX lesson | Fructan OS, Marketing Cloud |
| **Equilab / Ridely** | Safety/ride/edtech inspiration only | GPS gait AI, video curriculum as core |
| **ehorses** | Listing field completeness for sale view | Full marketplace liquidity |
| **BHS / BHA / FEI** | Trust/compliance awareness | Membership org, racing regulator, FEI app |

---

## D. Suggested build order (first delivery)

1. **Horse public Hub + profile completeness** (identity, media, pedigree, disciplines, sale fields, share pack) — social discovery surface  
2. **User public card polish** (avatar, bio, username, business display) — linked from entities only  
3. **Care-network social** (Connect, timeline feed, chat, reviews, read/full share modes)  
4. **Stable SaaS core** (profile, roster, stalls/groups, daily tasks drag-drop, health reminders, feed, docs)  
5. **Stable finance** (expenses, invoices from activities, owner dashboard)  
6. **Facilities + owner booking**  
7. **Sale “Carfax” summary + HorseTag**  
8. Later: Peppol, Equclub lessons, breeding, AI, ride GPS, marketplace

---

## Changelog

| Date | Change |
|------|--------|
| 2026-07-24 | Initial extraction from `equus/docs/product/benchMarket/webapps.md` for first-delivery social (user/horse) + stable SaaS; linked into module specs |
