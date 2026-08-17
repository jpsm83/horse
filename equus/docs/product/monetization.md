# Equus — Monetization

Who pays, catalog, promos, lapse, and what owners see. Index: [`businessPlan.md`](businessPlan.md). Benchmark: [`benchMarket/webapps.md`](benchMarket/webapps.md).

## Customer

| Layer | Who | Price |
|--------|-----|--------|
| Horse social (profiles, Hub, chat, favorites) | Horse owners | **Free**, unlimited horses |
| Owner **display** of saved stable events/invoices on horse Planning / Documents | Horse owners | **Always visible** (history is not deleted). Stable **cannot create new** ops when not in good standing |
| Stable SaaS | **Owning user of that entity** | **Paid** |

Equus **never invoices horse owners**. Stables already bill owners; they may add a line or fold Equus into boarding. That fee is **not** set or enforced by Equus.

A user who operates a stable **and** owns horses: pays **for the stable**, not for “being an owner.” Hub stays free. That closes the gap where a stable user never needs Hub and would skip an owner paywall.

Later modules: **one subscription per entity**. A vet practice is not billed on the stable’s invoice. Same catalog **shape** (roster/caseload bands); exact vet bands can be copied or adjusted when that module ships.

## Good standing

An entity is in **good standing** when its subscription is:

- inside the **default 30-day free** period, or  
- **paid** for the current cycle, or  
- covered by an **active promo** (free days, % off, complimentary period)

Good standing unlocks **full SaaS writes** and the **live owner portal** for horses linked to that entity.

## Roster meter (stable)

Count **current** horses only:

- accepted, **active** horse ↔ stable `Relationship`, plus  
- **waiting-transfer** horses the stable still hosts  

**Do not** count ended / historical horses.

Bands are the **public catalog**. They do **not** auto-lock the product when the yard adds a horse. Price is stored **on the entity** and can be overridden (custom amount, extra promo). Adding horse 16 does not by itself change Stripe — ops/sales (or a later true-up job) updates the entity price.

## EUR catalog (placeholders until Spanish yard interviews)

Monthly, excl. VAT. Beachhead currency for Spain.

| Band | Roster | Price / month | Notes |
|------|--------|----------------|--------|
| Starter | 1–5 | **€49** | |
| Small | 6–15 | **€99** | |
| Medium | 16–30 | **€179** | |
| Large | 31–60 | **€299** | |
| Scale | 61+ | **€4 × horses**, **floor €299** | 61–74 horses → **€299**. From 75 horses → `horses × €4` (75 → €300, 100 → €400). |

Why the floor: 60 horses at Large = €299; 61 × €4 = €244 would **cut** the bill. Floor prevents that inversion.

**USD / GBP:** same band *shape*, **own** list prices (not live FX). Fill before US/UK GTM. Entity **location** selects currency (USA → USD, Eurozone → EUR, UK → GBP).

**Billing cycle:** monthly at launch.

Vs market (full stable stack, not activity-only): HippoVibe ~€3/horse; EquineM full stack ~€90 at 5 horses / ~€130 at 20; Equicty from ~€30/month by band. We sell **one** Stable bundle (ops + owner portal + graph), so we sit near EquineM all-in, a bit under, not at HippoVibe’s floor.

## Default offer + custom promos

**Default (every new paid entity):** **30 days full SaaS free**, then catalog (or custom) price. During these 30 days the entity is in **good standing**.

**Custom (per entity, anytime):** attach another period: extra free days, percent off for a date range, complimentary week on a cycle, founding discount, etc. Multiple deals over the life of the customer. Implementation is a billing adjustment on the entity (start, end, type), not a global coupon-only model.

Self-serve signup **shows the catalog**. Ops can replace that entity’s price or stack a promo later.

## Lapse (entity did not pay)

When the free period / paid cycle / promo **ends** with no valid payment:

1. **7 days:** reminders to the entity owning user. **Ops still live.**  
2. **Then — write lock:** no **new** logs, invoices, planning, roster writes. Roster and history **read-only** inside the stable module.  
3. **Public stable page + chat stay up.**  
4. **Owner horse page:** Hub stays social. **Saved** Planning events and Documents invoices **stay visible**. The stable cannot add **new** ones until good standing.  

Other horses at a **different** paying entity are untouched. Other stables the same user owns are billed separately.

This is **not** “the horse is blocked because the owner didn’t pay us.” The customer is the **entity**.

## Waiting-transfer vs money

Waiting-transfer is an **ownership** problem. It does **not** create a horse-owner Equus invoice.

- Daily nag forever until claim ([`graph-and-identity.md`](graph-and-identity.md)).  
- Those horses **do** sit on the paid/free **roster** (the stable is using SaaS on them).  
- No extra Hub/ops lock **because** they are unclaimed.

## What we do not sell (launch)

- Owner subscriptions, per-horse owner tiers, $99/horse  
- Free Stable SaaS as the GTM  
- Partner commission on owner payments  
- Pay-to-win badges  

## Implementation notes (for engineering)

- Stripe (or equivalent) customer = **User** who owns the entity; subscription metadata = `entityType` + `entityId`.  
- Catalog band is a **suggestion** at signup; persisted price on the entity wins.  
- Instrument: entity subscription states (`trialing` / `active` / `past_due` / `write_locked`), roster size, promo windows. See [`metricsSpec.md`](metricsSpec.md).
