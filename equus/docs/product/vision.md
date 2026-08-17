# Equus — Product Vision

What we are building and why. Rules of the graph: [`graph-and-identity.md`](graph-and-identity.md). Money: [`monetization.md`](monetization.md). Index: [`businessPlan.md`](businessPlan.md).

## The product

Equus is a **horse-industry graph** with two skins on the same data:

1. **Social / Hub (free)** — horses (and businesses) have public or semi-public pages. People chat like WhatsApp. Users **favorite** horses and entities to find them again. There is **no** people search, **no** follow graph, **no** public Instagram-style feed, **no** likes.
2. **SaaS / ops (paid per entity)** — each business module (stable at launch; later vet, trainer, groomer, …) is a real workplace: roster, planning, records, invoices, team. The **entity’s owning user** pays. Horse owners are not Equus’s billing customers.

Home after login is **My Graph**: my horses, my workplaces, pending invites, favorites. From there the user enters a module. Inside a module, that module is first-class (on a horse surface, search is horses; on a stable surface, search is stables).

## The problem

Horse life is split across products that do not share a horse:

| Job | Who owns it today | Gap |
|-----|-------------------|-----|
| Daily stable ops | EquineM, Equicty, HippoVibe | Stable **tenant** owns the data; owners and vets are contacts inside one org |
| Owner CRM / health diary | Happie, My Cheval, Equestrian App | Weak or no multi-business network; little real stable ERP |
| Ride / social / training content | Equilab, Ridely | Not operations |
| Buy/sell | ehorses | No care record after the sale |
| Compliance | FEI HorseApp, BHA | Mandatory niches; not a life OS |

Nobody runs **one horse record** that a livery, a vet, a trainer, and an owner all attach to by **consent**, with the horse still findable as a social Hub.

## What we are not

- Not EquineM’s **tenant model** (stable owns every contact). We match stable **ops depth**; we exceed on graph and owner Hub.
- Not Instagram / Equilab-for-horses. No open feed, follow, or people directory.
- Not ehorses. Marketplace deal-flow is last.
- Not a federation app. Integrate/export later; do not rebuild FEI or BHA.

## Who it is for

| Person | Job on Equus |
|--------|----------------|
| **Horse owner** | Free Hub, chat, favorites, unlimited horse profiles. Sees stable ops on a horse **only** while that stable’s subscription is in good standing (included portal). Never pays Equus. |
| **Stable operator** | Pays for Stable SaaS. Runs the yard. Invites owners. May pass Equus through in boarding. Can also own horses on the same login (social stays free; the **stable** is what they pay for). |
| **Collaborators** (groom, rider, …) | Users invited to a stable via `WorkplaceRelationship`. Until their own module exists they are not a separate SaaS product. |
| **Later: vet, trainer, groomer, …** | Independent paid modules, same pattern as stable. Can also collaborate at a stable. |

One **User** (one email, one login) can wear every hat at once: own a stable, be a vet later, own five horses.

## Launch vs destination

| Now (public launch bar) | Next modules | Last |
|-------------------------|--------------|------|
| User + Horse + **Stable SaaS** | Veterinary, trainer, groomer, … each as its own SaaS | Marketplace, stud webshop, ride GPS as a product, federation rebuilds |

Success at launch is **yards in Spain running daily ops** and **owners using Hub + chat** because their stable is on Equus — not feature count.

## Competitive one-liner

Stable ERPs charge the yard and trap the horse in one org. Consumer apps charge the owner and skip the yard. Equus charges the **yard** (like EquineM) and keeps the **horse as a portable Hub** (like a modern owner app), with chat and favorites instead of a social network.
