# Equus — Graph and Identity

Canonical rules for accounts, modules, search, relationships, and ownership. Index: [`businessPlan.md`](businessPlan.md). Journeys: [`productFlows.md`](productFlows.md).

## Identity

**There is no business login.** Signup is always one **User** (one person, one email).

After signup, the same User may create **role profiles** (documents): `Horse`, `Stable`, later `Veterinary`, `Trainer`, `Groomer`, etc. Navigating to “my stable” or “my horses” is routing in the **same session**, not account switching.

```
User (login)
  ├── Horse(s) they own (`Horse.mainOwnerUserId` + optional `coOwners[]`)
  ├── Stable(s) they operate (multiple allowed)
  ├── later: Veterinary, Trainer, Groomer, Transport, Breeder, Riding club, …
  └── WorkplaceRelationship(s) — they collaborate at someone else’s profile
```

- **User** = authentication, chat identity, billing customer **when they own a paid entity**.
- **Role profile** = the module (horse, stable, …).
- Users are **never searchable**. A user page is only reached from an entity (e.g. stable owner link), gated by `User.preferences` (`profileVisibility`, `allowDirectMessagesFrom`).

## Home: inbox (My Graph)

After login, home is **not** a roster of all horses/stables. It is an **action inbox**:

- Pending relationship and workplace invites  
- **Waiting-transfer** horses this user still `mainOwner`s  

Work happens in modules: Horse list default **mine**; Stable list default **mine**; Favorites = filter on each entity list. See [`../features/myGraph.md`](../features/myGraph.md).

**Last-used module is not the product home.**

## Search: module-contextual, no people

First-class search depends on **which page / module** the user is in:

| Surface | Search first-class |
|---------|-------------------|
| Horse | Horses |
| Stable | Stables |
| later Vet | Veterinaries |
| Discovery browse | The entity type of that browse route |

There is **no** “search users / find people” directory.

## Modules are first-class products

Each module has its own focus and UX. They connect **only** through the graph (relationships + workplace links).

| Module | Launch | Role |
|--------|--------|------|
| **User** | Required | Identity, My Graph, chat, favorites, prefs |
| **Horse** | Required | Free social Hub + owner record |
| **Stable** | Required | Paid stable SaaS |
| Veterinary, trainer, groomer, … | Post-launch | Own paid SaaS; optional `WorkplaceRelationship` at a stable |
| Transport, breeder, riding club, … | Later | Same pattern |

Until a provider module exists, that person is a **User** who can chat, be favorited only as a user-via-entity link, and **collaborate at a stable**.

## Social skin (what is allowed)

| Allowed | Not allowed |
|---------|-------------|
| Public / semi-public **entity** pages (horse Hub, stable page) | People search |
| WhatsApp-style **open chat** between users (no relationship required) | Follow graph |
| **Favorites** (private, per user, horses and entities) | Public activity feed / likes / Instagram wall |
| Horse-scoped **reviews** on verified established horse↔provider relationships (bidirectional) | Anonymous open reviews |
| Relationship-scoped **timeline** on a horse (caregivers + owner) | Global “for you” feed |

Favorites are **not** relationships. They do not unlock ops, reviews, or roster seats.

## Two link types

1. **`Relationship`** — horse ↔ provider profile (stable, later vet, …). Operational data for that horse requires **accepted** status. Established (accepted) records are **permanent**; they may move to `ended` but are not deleted. Owner sees **only their horses**.
2. **`WorkplaceRelationship`** — User ↔ host profile (e.g. Stable). Hierarchy on the link (`admin` \| `manager` \| `staff`). Multi-stable allowed. See `equus/docs/features/workplaceRelationship.md`.

Stable staff write on a hosted horse when they have an **active workplace** at that stable **and** the horse has an **accepted** horse↔stable `Relationship`. No separate groom↔horse link required.

**Direct path:** owner may accept horse↔provider without a stable (e.g. later: vet at home).

## Who may start a horse ↔ stable relationship

Two legal paths (both require accept by the other side):

### Path 1 — Owner already has the horse

Owner invites the stable (later any provider module). Receptor accepts or declines. Declined invites create no ops; owner may send again.

### Path 2 — Stable already boards the horse

The stable **may create** the horse they host. That does **not** make the stable the real-world owner.

- Creating user becomes `Horse.mainOwnerUserId` (everything is user-owned).  
- Horse is flagged **waiting-transfer**.  
- Creating the horse **requires the real owner’s email**.  
- App emails the owner: create an Equus account and **take ownership**.  
- After the owner accepts transfer: they are `mainOwner`; the stable is **host** (accepted horse↔stable `Relationship`), not owner.

If the owner never claims: the creating user **stays** `mainOwner` (the incorrect real-world state). Mitigation is **not** a feature lock and **not** a horse invoice. Mitigation is **daily reminders forever** to the stable user and the invited owner until transfer completes.

Waiting-transfer horses **count on the stable roster** for SaaS pricing (they are hosted). See [`monetization.md`](monetization.md).

## Ownership transfer (horses and host businesses)

Consent collection `OwnershipTransfer` for horses and host businesses (stable, later breeder, transport, riding club). **Service profiles are not transferable.**

Kinds: `transfer_main`, `remove_co_owner`, `promote_co_owner`. See `equus/docs/features/ownershipTransfer.md`.

Billing for **Stable SaaS** stays on the **stable entity’s** owning user, not on horse `mainOwner`. When a **stable** itself is transferred, the new main owner of that stable is the SaaS customer.

## Permissions (ops)

Access is **role + relationship + scope + time**:

- A stable operates horses it currently hosts (and historical read per policy).  
- After `ended`, write stops; history remains.  
- Owners see full Hub **social** always (free).  
- Owners see **live stable ops** on a horse only while that stable subscription is in **good standing** ([`monetization.md`](monetization.md)).  
- Chat does not grant ops access.

## Privacy tiers (horse)

- **Public:** Hub identity, media per visibility, competition results as configured  
- **Relationship-visible:** care logs, treatments, invoices — when the provider is accepted **and** (for live stable data) the entity is in good standing  
- **Owner-only:** sensitive docs, private notes  

Per-horse `profileVisibility` and `contactDisplay` remain.

## Reviews

Only for a verified horse + `relationshipId` pair. Either side of that relationship may review the other. No cross-horse reuse. Horse does not log in; owner/co-owner operates horse-side reviews.

## Invitations (growth, not commission)

Inviting a missing party by email remains. There is **no** owner-subscription referral commission. Do not require a “referral reference for 10%” on invites. Optional internal attribution for analytics is fine.
