# Equus — Business Plan (index)

Working business plan for Equus. This file is the **short source of truth**. Detail lives in the files linked below. If a sibling doc disagrees with the lock table here, the lock table wins until that sibling is updated.

**Audience:** founders, product, and agents. Open one topical file; do not ingest the old 20-section plan.

## How to read this folder

| If you need… | Open |
|--------------|------|
| What Equus is (and is not) | [`vision.md`](vision.md) |
| Users, modules, search, relationships, ownership | [`graph-and-identity.md`](graph-and-identity.md) |
| Who pays, catalog, promos, lapse, owner portal | [`monetization.md`](monetization.md) |
| Spain beachhead, languages, growth | [`go-to-market.md`](go-to-market.md) |
| What we build first vs launch bar | [`mvpScope.md`](mvpScope.md) |
| Journeys | [`productFlows.md`](productFlows.md) |
| Interviews / go-no-go | [`validationPlaybook.md`](validationPlaybook.md) |
| Internal metrics | [`metricsSpec.md`](metricsSpec.md) |
| Competitor features to steal | [`firstDeliveryCompetitiveBacklog.md`](firstDeliveryCompetitiveBacklog.md) |
| Full competitor research | [`benchMarket/webapps.md`](benchMarket/webapps.md) |

Related (features + engineering aligned 2026-08-16): [`../features/`](../features/), [`../README.md`](../README.md) (filename index only). Prefer this lock table if a spec fights it. Billing **implementation** is [`../engineering/billing.md`](../engineering/billing.md) (`drift`: do not extend owner-tier code).

## Onboarding read order (humans / planning)

Not required for routine coding. Agents: open **one** topical file from the table above, or a single row below if you are onboarding — do not ingest the whole list.

| Document | Purpose |
|----------|---------|
| This file | **Product index + lock table** |
| [`vision.md`](vision.md) | What Equus is (social skin + SaaS skin) |
| [`graph-and-identity.md`](graph-and-identity.md) | Users, modules, search, relationships, waiting-transfer |
| [`monetization.md`](monetization.md) | Catalog, promos, lapse, owner portal |
| [`go-to-market.md`](go-to-market.md) | Spain beachhead; EN default + ES + PT |
| [`../engineering/stack.md`](../engineering/stack.md) | Technical stack |
| [`mvpScope.md`](mvpScope.md) | Build phases and production launch gate |
| [`../features/horseModule.md`](../features/horseModule.md) | Horse feature spec |
| [`../features/stableModule.md`](../features/stableModule.md) | Stable SaaS spec |
| [`../features/userModule.md`](../features/userModule.md) | User spec |
| [`../features/entitySubscription.md`](../features/entitySubscription.md) | Who pays / good standing |
| [`../features/myGraph.md`](../features/myGraph.md) | Home = pending + waiting-transfer |
| [`../features/favorites.md`](../features/favorites.md) | Favorites |
| [`../features/chat.md`](../features/chat.md) | User-to-user chat |
| [`../features/workplaceRelationship.md`](../features/workplaceRelationship.md) | User ↔ role profile workplace |
| [`benchMarket/webapps.md`](benchMarket/webapps.md) | Market benchmark |
| [`firstDeliveryCompetitiveBacklog.md`](firstDeliveryCompetitiveBacklog.md) | First-delivery extract |
| [`validationPlaybook.md`](validationPlaybook.md) | Interviews / go-no-go |
| [`productFlows.md`](productFlows.md) | Core journeys |
| [`../features/dataLifecycle.md`](../features/dataLifecycle.md) | No hard deletes |
| [`../features/ownershipTransfer.md`](../features/ownershipTransfer.md) | Consent ownership |
| [`metricsSpec.md`](metricsSpec.md) | Internal metrics (Phase 1B) |

## One-line pitch

A connected horse **graph**: free horse social (Hub, chat, favorites) plus **paid SaaS per business module** (stable first, then vet, trainer, groomer, …), with every horse, person, and business wired by explicit relationships.

## Lock table (canonical)

| Topic | Decision |
|--------|----------|
| Product | Relationship **graph**. Social and SaaS are skins. Home is an **inbox** (pending + waiting-transfer). |
| Search | **No people search.** First-class = current module / page. Horse/stable lists default **mine**. |
| Social | Ops links + **WhatsApp-style chat** + **private favorites** (filter on entity lists). No follow, public feed, or likes. |
| Launch | **User + Horse + Stable SaaS.** Then vet / trainer / groomer as **their own paid SaaS**, also optional stable **collaborators**. |
| Links | Owner invites entity **or** barn creates a boarded horse and must push **ownership transfer**. |
| Temp owner | Creator’s **user** is `mainOwner` + **waiting-transfer** flag. After claim: owner owns, barn **hosts**. |
| Unclaimed | **Daily nag forever** (barn + invited owner). No feature lock for waiting-transfer. |
| Who pays | **Entity pays SaaS.** Horse Hub / chat / favorites / unlimited profiles = **free**. Equus never invoices horse owners. Yard may pass cost through in boarding. |
| Owner horse page | Hub = social. Planning = calendar. Documents include invoices. **History always visible.** Write-lock only stops **new** stable ops. |
| Meter | **Current roster** (active horse↔stable links + waiting-transfer horses still hosted). Past horses do not count. |
| EUR catalog | 1–5 **€49** · 6–15 **€99** · 16–30 **€179** · 31–60 **€299** · 61+ **€4/horse, floor €299**. Public catalog; **overridable** per entity. |
| Currency | From **entity location** (EUR / USD / GBP). Own list prices per currency, not live FX. |
| Offers | **30 days free** default on new paid entities. Extra free / % / complimentary days **per entity, anytime**. |
| Lapse | **7 days** live + reminders → **write lock**, history read-only, public page + chat stay. |
| GTM | **Spain** first. UI **English default**, plus **Spanish** and **Portuguese**. |
| Billing cycle | **Monthly** at launch. Annual later if needed. |
| Later modules | Same catalog **shape**, one subscription **per entity** (a vet practice is not billed on the stable’s invoice). |

## Dead (do not reintroduce)

- Owner pays per horse / $99 / owner horse-count tiers  
- Businesses use SaaS free as the growth tactic  
- 14-day **horse-owner** trial  
- Hub opaque because *the owner* did not pay Equus  
- Dunning owners then freezing the horse inside every barn/vet screen  
- Partner **10% commission on owner subscriptions** (old Section 19)  
- Production launch requiring a full **Veterinary** module  
- “Utility first, not a horse social app” as the product identity (social is a real skin; it is not Instagram)

## Positioning vs barn ERPs

EquineM / Equicty / HippoVibe: **stable tenant pays**, owners are contacts inside one org.  
Equus: **stable (entity) still pays** for ops, but the **horse is portable** across independent accounts, owners get a **free Hub + included portal**, and later vets/trainers are **their own SaaS**, not contacts trapped in the yard.

Evidence: [`benchMarket/webapps.md`](benchMarket/webapps.md).

## Changelog

| Date | Change |
|------|--------|
| 2026-08-16 | Replaced kitchen-sink plan with index + lock table. Entity-pays SaaS; free horse social. Launch = User + Horse + Stable. Spain beachhead. |
