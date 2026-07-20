# Horse Module Ã¢â‚¬â€ Feature Specification

Living document for planning, updating, and tracking **horse-facing** capabilities before and during build.

**Audience:** product, engineering, and GTM Ã¢â‚¬â€ use this file to add, remove, or reprioritize horse features before implementation starts on each area.

**Related docs:**
- [`equinem.md`](equinem.md) Ã¢â‚¬â€ competitor capability baseline (EquineM)
- [`businessPlan.md`](businessPlan.md) Ã¢â‚¬â€ vision, monetization (Section 11), relationship rules, Section 10.3 Horse module
- [`mvpScope.md`](mvpScope.md) Ã¢â‚¬â€ build phases vs production launch gate
- [`userModule.md`](userModule.md) Ã¢â‚¬â€ identity, privacy, discovery layers
- [`ownershipTransfer.md`](ownershipTransfer.md) Ã¢â‚¬â€ consent-based main/co-owner changes (`OwnershipTransfer`)
- [`productFlows.md`](productFlows.md) Ã¢â‚¬â€ owner Ã¢â€ â€ provider flows
- [`stableModule.md`](stableModule.md) Ã¢â‚¬â€ barn operations on hosted horses (complementary, not duplicate)
- [`dataLifecycle.md`](dataLifecycle.md) Ã¢â‚¬â€ no hard deletes; horse-attached records survive provider deactivation

---

## Product principles (horse)

1. **Horse is the canonical record** Ã¢â‚¬â€ one profile shared across owners, stables, vets, trainers, and other linked providers; the horse document is the hub, not the stable or owner account.
2. **Entity-owned** Ã¢â‚¬â€ horses link via `Horse.mainOwnerUserId` (+ optional `coOwners[]` on the horse). No `User.horseProfileIds` array; ownership helpers live in `lib/ownership/entityOwnership.ts`.
3. **Owner pays per tier** - subscription is on the user (`User.subscription.tier`); each tier limits how many horses the user can own (Free: 1, Bronze: 3, Silver: 5, Gold: 8, Diamond: unlimited). Co-owners do not count toward the limit (see `businessPlan.md` Section 11 and `documentation/billing.md`).

4. **Two-layer discovery** - `Horse.profileVisibility` and `Horse.contactDisplay` gate the public card; when `useOwnerContact: true`, owner identity/contact is filtered through `User.preferences` via `lib/privacy/userVisibility.ts`.
5. **Relationship-first access** Ã¢â‚¬â€ providers act on a horse only through accepted `Relationship` documents (or barn operational path for hosted horses). Provider links are **not** stored as bare refs on `Horse`.
6. **Permanent history** Ã¢â‚¬â€ established relationships and timeline entries remain after a horse leaves a stable or a provider link ends; owners retain read access to their horse data per policy (see [`dataLifecycle.md`](dataLifecycle.md) Ã‚Â§ horse-attached records).
7. **Portable record** Ã¢â‚¬â€ horse data follows the horse across stables and providers; EquineM parity on core profile, health, documents, and location history, plus ecosystem discovery and horse-scoped reviews.

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

## 1. Horse profile and identity

**Baseline API (shipped):** create with all profile fields + discovery PATCH + public read Ã¢â‚¬â€ `POST /api/v1/horses`, `PATCH /api/v1/horses/:id/discovery`, `GET /api/v1/horses/:id`. Media upload via `POST /api/v1/media/upload`. See [`equus/documentation/horses.md`](../equus/documentation/horses.md). Full profile CRUD, directory search remain below.

| ID | Feature | Parity | Status |
|----|---------|--------|--------|
| H-PROF-01 | Core identity: name, breed, sex, color, date of birth / age | Parity | done |
| H-PROF-02 | Registered name, registry id, microchip, passport number | Parity | done |
| H-PROF-03 | Height, marks, country of birth, import/export status | Parity | done |
| H-PROF-04 | Primary discipline and discipline list | Parity | done |
| H-PROF-05 | Description, notes, profile image | Parity | done |
| H-PROF-06 | Photo and video gallery (`FileUpload` + `POST /api/v1/media/upload`) | Parity | done |
| H-PROF-07 | Pedigree / bloodline (manual) | Parity | done |
| H-PROF-08 | Full owner/co-owner edit of profile fields (PATCH horse) | Parity | done |
| H-PROF-09 | Commercial fields: estimated value, sale status, asking price, showValuePublicly | Beyond | done |
| H-PROF-10 | Entity tab navigation (Hub, Edit, Discovery, History, Relations) | Beyond | done |

### Entity tab navigation

Horse detail pages now include a tab bar at the top (Hub, Edit, Discovery, History, Relations) rendered by the reusable `EntityTabs` component (`components/ui/entity-tabs.tsx`). Tabs with `requireOwnership: true` are hidden for non-owners.

**Usage for other modules:**
```tsx
import { EntityTabs, type EntityTab } from "@/components/ui/entity-tabs.tsx";

const tabs: EntityTab[] = [
  { id: "hub", label: "Hub", href: `/entity/${id}` },
  { id: "edit", label: "Edit", href: `/entity/${id}/edit`, requireOwnership: true },
];
<EntityTabs tabs={tabs} isOwner={isOwner} />
```

---

## 2. Ownership and syndicates

| ID | Feature | Parity | Status |
|----|---------|--------|--------|
| H-OWN-01 | Main owner (`mainOwnerUserId`) on create; `createdByUserId` audit | Beyond | done |
| H-OWN-02 | Co-owners array with ownership percentage (`coOwners[]` embed) | Parity | done |
| H-OWN-03 | ~~Co-owner billing responsibility flag (who pays when syndicate)~~ — Moot under user-tier billing model. Businesses register as business users instead. | Beyond | cancelled |
| H-OWN-04 | Ownership history via `OwnershipTransfer` audit trail | Parity | done |
| H-OWN-05 | Owner/co-owner authorization for discovery PATCH and sensitive fields | Beyond | done |
| H-OWN-06 | Transfer / co-owner lifecycle via `OwnershipTransfer` ([`ownershipTransfer.md`](ownershipTransfer.md)) | Beyond | done |
| H-OWN-07 | Responsible persons (`responsibles[]` embed) — admin-level access without ownership; managed via `add_responsible`/`remove_responsible` transfer kinds | New | done |

---

## 3. Discovery and public listing

Two-layer model: horse visibility (`profileVisibility`: `public` / `relationship` / `owner_only`) then contact resolution (`contactDisplay` + user privacy). See [`equus/documentation/horses.md`](../equus/documentation/horses.md).

| ID | Feature | Parity | Status |
|----|---------|--------|--------|
| H-DISC-01 | Per-horse `profileVisibility` (default `public`) | Beyond | done |
| H-DISC-02 | Per-horse `contactDisplay` (owner contact vs delegate) | Beyond | done |
| H-DISC-03 | Public horse card with resolved contact (`GET /api/v1/horses/:id`) | Beyond | done |
| H-DISC-04 | Owner/co-owner discovery PATCH (`PATCH /api/v1/horses/:id/discovery`) | Beyond | done |
| H-DISC-05 | `showValuePublicly` and sale listing visibility | Beyond | done |
| H-DISC-06 | Discover directory / search (location, for sale) | Beyond | done |
| H-DISC-07 | Anonymous vs relationship-scoped visibility enforcement | Beyond | done |

---

## 4. Provider relationships

Provider links use `Relationship` documents (`relationshipType`: stable, trainer, veterinary, groom, farrier, rider, coach, transport, breeder, ridingClub). No provider refs on `Horse`.

| ID | Feature | Parity | Status |
|----|---------|--------|--------|
| H-REL-01 | Owner sends horse → provider invitation (any provider type) | Beyond | done |
| H-REL-02 | Email invitation for unregistered party | Beyond | done |
| H-REL-03 | Accept / decline; resend after mistaken decline | Beyond | done |
| H-REL-04 | Established relationship permanent; `ended` retains history | Beyond | done |
| H-REL-05 | List current providers per horse (query accepted relationships) | Beyond | done |
| H-REL-06 | List historical providers per horse | Parity | done |
| H-REL-07 | Horse-scoped review after verified relationship (bidirectional) | Beyond | done |
| H-REL-08 | Reviewee response to horse-scoped reviews | Beyond | done |

---

## 5. Owner dashboard and timeline

| ID | Feature | Parity | Status |
|----|---------|--------|--------|
| H-DASH-01 | Horse dashboard: single-horse hub for owner/co-owner | Beyond | planned |
| H-DASH-02 | Unified timeline (health, training, stable, transport, competition) | Parity | planned |
| H-DASH-03 | Filter timeline by source (stable, vet, trainer, owner) | Parity | planned |
| H-DASH-04 | Owner expense summary per horse (invoices, stable charges) | Beyond | planned |
| H-DASH-05 | Multi-horse list for owner (`/horses`) | Parity | done |
| H-DASH-06 | Notifications for timeline updates and relationship events | Beyond | planned |
| H-DASH-07 | Owner retains read access after provider relationship ends | Beyond | planned |

---

## 6. Health, care, and vaccinations

| ID | Feature | Parity | Status |
|----|---------|--------|--------|
| H-HEALTH-01 | Health events on timeline (vaccinations, injuries, treatments) | Parity | planned |
| H-HEALTH-02 | Vaccination rules / schedules per horse | Parity | planned |
| H-HEALTH-03 | Automated vaccination reminders | Parity | planned |
| H-HEALTH-04 | Vet treatment records (owner-visible scope per consent) | Parity | planned |
| H-HEALTH-05 | Medication plans linked to vet visits | Parity | planned |
| H-HEALTH-06 | Feed and supplement history visible on horse profile (from stable) | Parity | planned |
| H-HEALTH-07 | Transportation instructions | Parity | planned |

---

## 7. Documents and media

| ID | Feature | Parity | Status |
|----|---------|--------|--------|
| H-DOC-01 | Upload documents (passport, insurance, certificates) | Parity | planned |
| H-DOC-02 | Document organization (folders/tags per horse) | Parity | planned |
| H-DOC-03 | URLs and external links per horse | Parity | planned |
| H-DOC-04 | Digital tack room | Parity | planned |
| H-DOC-05 | Permission-scoped document access per relationship | Beyond | planned |

---

## 8. Competition and performance

| ID | Feature | Parity | Status |
|----|---------|--------|--------|
| H-COMP-01 | Competition results on horse profile (`competitionResults[]`) | Parity | planned |
| H-COMP-02 | Trainer/club adds event Ã¢â€ â€™ results on horse timeline | Parity | planned |
| H-COMP-03 | Performance history and basic analytics | Beyond | planned |
| H-COMP-04 | Riding club / event registration links | Beyond | planned |

---

## 9. Location and transport history

| ID | Feature | Parity | Status |
|----|---------|--------|--------|
| H-LOC-01 | Current location / stable hosting (via active stable relationship) | Parity | planned |
| H-LOC-02 | Location history (arrival, departure, stable changes) | Parity | planned |
| H-LOC-03 | Transport move events on timeline (origin, destination, dates) | Parity | planned |
| H-LOC-04 | Integration with transport module bookings (when shipped) | Beyond | planned |

---

## 10. Subscription and billing (owner pays)

| ID | Feature | Parity | Status |
|----|---------|--------|--------|
| H-BILL-01 | Per-horse subscription model (`trial` Ã¢â€ â€™ paid; default $99/month placeholder) | Beyond | planned |
| H-BILL-02 | 30-day trial per horse on create | Beyond | planned |
| H-BILL-03 | Main owner as payer; co-owners linked without duplicate billing | Beyond | planned |
| H-BILL-04 | Referral attribution on horse subscription (`referralReference`, commission window) | Beyond | planned |
| H-BILL-05 | Payment provider integration (Stripe or equivalent) | Beyond | planned |
| H-BILL-06 | Subscription status gates full horse hub features | Beyond | planned |

---

## 11. Communication

| ID | Feature | Parity | Status |
|----|---------|--------|--------|
| H-COM-01 | Open live chat with linked providers and owners (horse context) | Beyond | planned |
| H-COM-02 | Relationship and booking notifications | Beyond | planned |
| H-COM-03 | Structured inquiries from discovery (pre-relationship) | Beyond | planned |
| H-COM-04 | Reports emailed to owner from stable/vet | Parity | planned |

---

## 12. Beyond EquineM (horse-centric differentiators)

Capabilities EquineM does **not** center on horse-as-portable-hub:

| ID | Feature | Status |
|----|---------|--------|
| H-DIFF-01 | Independent provider accounts on same horse (network, not org roster) | planned |
| H-DIFF-02 | Two-layer discovery: horse visibility + owner privacy policy | done |
| H-DIFF-03 | Portable horse record across stables and providers | planned |
| H-DIFF-04 | Horse discoverable in ecosystem search (for sale, discipline, location) | planned |
| H-DIFF-05 | Horse-scoped verified reviews (bidirectional, not anonymous wall) | planned |
| H-DIFF-06 | Owner unified dashboard across stable, vet, trainer costs and records | planned |
| H-DIFF-07 | Browse-first: explore horses before creating owner profile | planned |
| H-DIFF-08 | Multi-role single login (owner + trainer + stable on one User) | planned |

---

## 13. Production readiness (horse slice)

The horse module is **production-ready** when every feature required for launch in Sections 1Ã¢â‚¬â€œ11 above is `done` and acceptance criteria pass.

Cross-module production gate (all must be ready together): see [`mvpScope.md`](mvpScope.md) Ã¢â‚¬â€ **Production launch requirements** (User, Horse, Veterinary, Stable modules).

### Horse launch acceptance (summary)

- [ ] Owner can create horse, set main owner, and operate basic profile at EquineM parity
- [ ] Discovery baseline works: public card, relationship-scoped visibility, delegate vs owner contact, private owner + public horse
- [ ] Co-owners can be linked with ownership percentage
- [ ] Owner dashboard shows unified timeline for linked stable and vet activity
- [ ] Documents upload and view with correct relationship scope
- [ ] Vaccination rules and health events visible per policy
- [ ] Location / stable history accurate across moves
- [ ] Subscription trial and paid state enforced for main owner
- [ ] Horse-scoped reviews work for verified relationships (bidirectional)
- [ ] Established relationships permanent; owner retains horse data access after provider link ends
- [ ] Provider list derived from `Relationship` queries, not denormalized horse fields

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-30 | Create-horse web UI at `/horses/new` (baseline identity + discovery fields); H-PROF-01 partial |
| 2026-06-30 | Initial specification from `businessPlan.md` Ã‚Â§4.1 / Ã‚Â§10.3, `mvpScope.md`, `equinem.md`, and shipped horse discovery API |
