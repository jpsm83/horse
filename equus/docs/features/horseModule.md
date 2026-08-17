# Horse Module — Feature Specification

Living spec for **horse-facing** capabilities. **Product is source of truth:** [`equus/docs/product/businessPlan.md`](../product/businessPlan.md), [`graph-and-identity.md`](../product/graph-and-identity.md), [`monetization.md`](../product/monetization.md).

The horse **page is an owner/viewer display**. **Ops writes** (whiteboard, invoicing, feed plans) live on the **entity** (stable now; later vet, …). See [`stableModule.md`](stableModule.md), [`entitySubscription.md`](entitySubscription.md).

**Audience:** product, engineering, agents.

**Related:** [`userModule.md`](userModule.md), [`ownershipTransfer.md`](ownershipTransfer.md), [`chat.md`](chat.md), [`favorites.md`](favorites.md), [`dataLifecycle.md`](dataLifecycle.md), [engineering horse tabs](../engineering/horseTabs.md), [mvpScope](../product/mvpScope.md).

---

## Product principles (horse)

1. **Horse is the canonical record** — one profile shared across owners and linked providers.
2. **Entity-owned** — `Horse.mainOwnerUserId` + optional `coOwners[]`. No `User.horseProfileIds`.
3. **Horse social is free** — unlimited horse profiles. **No** owner Equus subscription, **no** horse-count tiers, **no** $99/horse.
4. **Two-layer discovery** — `profileVisibility` + `contactDisplay`; owner contact filtered via `User.preferences`.
5. **Relationship-first** — providers act through accepted `Relationship` (or stable collab dual-gate). No bare provider refs on `Horse`.
6. **Permanent history** — saved events, invoices, and documents **stay visible** to the owner if a stable write-locks or leaves. Not deleted.
7. **Waiting-transfer** — if a stable creates a boarded horse, creating user is temporary `mainOwner` + flag; daily nags until real owner claims.

---

## How to use this document

| Marker | Meaning |
|--------|---------|
| **planned / in progress / done** | Build status |
| **Parity / Beyond** | vs EquineM |

Keep IDs stable once referenced. Do not reintroduce owner-pays IDs.

---

## Horse owner tabs (locked)

Do not rename or drop. Routes/roles: [`equus/docs/engineering/horseTabs.md`](../engineering/horseTabs.md).

| Tab | Role |
|-----|------|
| **Hub** | Social only (read-only public/semi-public profile). Not care, not invoices. |
| **Connect** | Invites + connections. Owner invites providers; waiting-transfer claim surfaces here / ownership inbox. |
| **Planning** | Calendar aggregating horse + linked entities (care, stable time, vaccinations, feed, …). |
| **Media** | Photos/videos. |
| **Documents** | Files **and invoices section** (invoices originate on the entity; displayed here). |
| **Profile** | Edit identity / pedigree / about. |
| **Admin** | Visibility, sale, ownership actions. |
| **History** | **Audit log** (who did what) — not a second calendar. |

Guest: Hub only (per `allowedTabs`).

---

## 1. Horse profile and identity

**Baseline API (shipped):** `POST /api/v1/horses`, `PATCH …/discovery`, `GET /api/v1/horses/:id`. Media: `POST /api/v1/media/upload`. See [engineering horses](../engineering/horses.md).

| ID | Feature | Parity | Status |
|----|---------|--------|--------|
| H-PROF-01 | Core identity: name, breed, sex, color, date of birth / age | Parity | done |
| H-PROF-02 | Registered name, registry id, microchip, passport number | Parity | done |
| H-PROF-03 | Height, marks, country of birth, import/export status | Parity | done |
| H-PROF-04 | Primary discipline and discipline list | Parity | done |
| H-PROF-05 | Description, notes, profile image | Parity | done |
| H-PROF-06 | Photo and video gallery | Parity | done |
| H-PROF-07 | Pedigree / bloodline (manual) | Parity | done |
| H-PROF-08 | Full owner/co-owner edit of profile fields | Parity | done |
| H-PROF-09 | Commercial fields: estimated value, sale status, asking price, acquisition date | Beyond | done |
| H-PROF-10 | Entity tabs (Hub, Connect, Planning, Media, Documents, Profile, Admin, History) | Beyond | done |

---

## 2. Ownership and syndicates

| ID | Feature | Parity | Status |
|----|---------|--------|--------|
| H-OWN-01 | Main owner (`mainOwnerUserId`) on create; `createdByUserId` audit | Beyond | done |
| H-OWN-02 | Co-owners array with ownership percentage | Parity | done |
| H-OWN-04 | Ownership history via `OwnershipTransfer` | Parity | done |
| H-OWN-05 | Owner/co-owner authorization for discovery PATCH and sensitive fields | Beyond | done |
| H-OWN-06 | Transfer / co-owner lifecycle via `OwnershipTransfer` | Beyond | done |
| H-OWN-07 | Responsible persons (`responsibles[]`) | New | done |
| H-OWN-08 | **Waiting-transfer:** barn-created horse; flag; owner email required; daily nag until claim | Beyond | planned |

Claim uses `transfer_main` (or equivalent accept). After claim: owner = `mainOwner`; stable = **host** `Relationship`. Equus **horse billing does not exist** — do not move an owner subscription.

---

## 3. Discovery and public listing

| ID | Feature | Parity | Status |
|----|---------|--------|--------|
| H-DISC-01 | Per-horse `profileVisibility` (default `public`) | Beyond | done |
| H-DISC-02 | Per-horse `contactDisplay` | Beyond | done |
| H-DISC-03 | Public horse card | Beyond | done |
| H-DISC-04 | Owner/co-owner discovery PATCH | Beyond | done |
| H-DISC-05 | Value section via Layer-2 `hubSections` | Beyond | done |
| H-DISC-06 | Discover directory / search | Beyond | done |
| H-DISC-07 | Anonymous vs relationship-scoped visibility | Beyond | done |
| H-DISC-08 | Horse **list default = mine** (owned / co-owned / waiting-transfer I still own). Discovery and Favorites are filters | Beyond | planned |

---

## 4. Provider relationships

`Relationship` documents only (`relationshipType`: stable, trainer, veterinary, …).

| ID | Feature | Parity | Status |
|----|---------|--------|--------|
| H-REL-01 | Owner sends horse → provider invitation | Beyond | done |
| H-REL-01b | **Stable may create** a boarded horse (waiting-transfer) — not owner-only hosting | Beyond | planned |
| H-REL-02 | Email invitation for unregistered party | Beyond | done |
| H-REL-03 | Accept / decline; resend after decline | Beyond | done |
| H-REL-04 | Established relationship permanent; `ended` retains history | Beyond | done |
| H-REL-05 | List current providers | Beyond | done |
| H-REL-06 | List historical providers | Parity | done |
| H-REL-07 | Horse-scoped review (bidirectional) | Beyond | done |
| H-REL-08 | Reviewee response | Beyond | done |

---

## 5. Hub (social only)

| ID | Feature | Parity | Status |
|----|---------|--------|--------|
| H-HUB-01 | Read-only social Hub (hero, about, media subset, pedigree, people) | Beyond | done |
| H-HUB-02 | No ops, invoices, or care editing on Hub | Beyond | planned |

---

## 6. Planning (calendar)

Aggregates events from the horse and **linked entities**. Display on the horse; **create/update of entity events** on the entity module.

| ID | Feature | Parity | Status |
|----|---------|--------|--------|
| H-PLAN-01 | Calendar of care, stable time, vaccinations, feed, and other entity-sourced events | Beyond | planned |
| H-PLAN-02 | Owner **may create** own events | Beyond | planned |
| H-PLAN-03 | Owner **cannot edit** events created by other entities | Beyond | planned |
| H-PLAN-04 | Owner **reply** = chat with that entity’s operators + event attached ([`chat.md`](chat.md)) | Beyond | planned |
| H-PLAN-05 | Saved entity events remain visible if the stable is write-locked; no new entity events until good standing | Beyond | planned |

---

## 7. Health / feed (display)

Writes for hosted horses are on **stable** (and later vet). Horse shows them on Planning / Documents.

| ID | Feature | Parity | Status |
|----|---------|--------|--------|
| H-HEALTH-01 | Health events visible on Planning | Parity | planned |
| H-HEALTH-02 | Vaccination schedules visible | Parity | planned |
| H-HEALTH-06 | Feed history visible (from stable) | Parity | planned |
| H-HEALTH-07 | Transportation instructions | Parity | planned |

---

## 8. Documents and media

| ID | Feature | Parity | Status |
|----|---------|--------|--------|
| H-DOC-01 | Upload documents | Parity | done |
| H-DOC-02 | Folders/tags | Parity | planned |
| H-DOC-05 | Permission-scoped access | Beyond | planned |
| H-DOC-06 | Hard-delete files + Cloudinary policy | Parity | done |
| H-DOC-07 | **Invoices section** on Documents (issued by entities; owner display) | Beyond | planned |
| H-MEDIA-* | Media tab — see H-PROF-06 / engineering | Parity | done |

---

## 9. Location

| ID | Feature | Parity | Status |
|----|---------|--------|--------|
| H-LOC-01 | Current hosting via active stable relationship | Parity | planned |
| H-LOC-02 | Location history | Parity | planned |
| H-LOC-03 | Transport moves when that module exists | Parity | planned |

---

## 10. Communication

| ID | Feature | Parity | Status |
|----|---------|--------|--------|
| H-COM-01 | Open chat (user-to-user; horse context optional) — [`chat.md`](chat.md) | Beyond | planned |
| H-COM-02 | Relationship and booking notifications | Beyond | planned |
| H-COM-03 | Structured inquiries from discovery | Beyond | planned |
| H-COM-05 | Waiting-transfer **daily nag** (barn user + invited owner) until claim | Beyond | planned |

---

## 11. Differentiators

| ID | Feature | Status |
|----|---------|--------|
| H-DIFF-01 | Independent providers on the same horse | planned |
| H-DIFF-02 | Two-layer discovery | done |
| H-DIFF-03 | Portable record; history remains if a stable lapses | planned |
| H-DIFF-04 | Horse discoverable in search | planned |
| H-DIFF-05 | Horse-scoped reviews | planned |
| H-DIFF-07 | Browse-first | planned |
| H-DIFF-08 | Multi-role one User | planned |

---

## 12. Production readiness (horse)

Launch gate: **User + Horse + Stable** — [`mvpScope.md`](../product/mvpScope.md). **Not** Veterinary.

- [ ] Create horse; Hub social; tabs as locked
- [ ] List default **mine**; Favorites + discovery filters
- [ ] Owner invite **and** stable-created waiting-transfer + claim
- [ ] Planning rules (create own / no edit others / reply = chat)
- [ ] Documents + invoices section; history always visible
- [ ] Reviews; permanent relationships
- [ ] No owner Equus subscription

---

## 13. First delivery — market backlog

Social Hub + display, not Instagram. Extract: [`firstDeliveryCompetitiveBacklog.md`](../product/firstDeliveryCompetitiveBacklog.md) §A.

| ID | Feature | Market source | Status |
|----|---------|---------------|--------|
| H-FD-01 | Equipment sizes | My Cheval | planned |
| H-FD-02 | Body metrics | Happie, Equestrian App | planned |
| H-FD-03 | Shareable horse pack | HippoVibe | planned |
| H-FD-04 | Share modes vs relationship scopes | Happie | planned |
| H-FD-05 | HorseTag QR → Hub | Equestrian App | planned |
| H-FD-07 | Injury photo into Media | Equestrian App | planned |
| H-FD-08 | Sale care-history summary | Equestrian App | planned |
| H-FD-09 | Public Hub gallery subset | ehorses, Equicty | planned |
| H-FD-10 | Sale listing field completeness | ehorses | planned |
| H-FD-14 | Connect tab care network | Equestrian App | planned |

**Deferred:** GPS/RideSafe, fructan OS, FEI app, full marketplace, Ridely curriculum, global feed, follow.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-08-16 | Align with product: free horse social; tabs locked; Planning/Documents; waiting-transfer; **removed** owner billing section |
| 2026-07-24 | First delivery market backlog |
| 2026-06-30 | Initial spec |
