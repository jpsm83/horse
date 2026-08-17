# My Graph — home inbox

After login, **home is not a roster**. It is an **action inbox**. Source: [`equus/docs/product/graph-and-identity.md`](../product/graph-and-identity.md) as amended in the features lock (inbox-only).

Related: [`userModule.md`](userModule.md), [`favorites.md`](favorites.md), [`horseModule.md`](horseModule.md), [`stableModule.md`](stableModule.md), [`ownershipTransfer.md`](ownershipTransfer.md).

---

## What home shows

| Block | Contents |
|-------|----------|
| **Pending relationships** | Horse↔provider invites to accept/decline |
| **Pending workplaces** | Collaboration invites |
| **Waiting-transfer** | Horses this User still `mainOwner`s that are flagged waiting-transfer (barn-created, real owner not claimed) |

That is the full home. **No** “all my horses,” **no** “all my stables,” **no** full favorites catalog.

## Where work lives

| Job | Where |
|-----|--------|
| My horses | **Horse** module list — default filter **mine** |
| My stables | **Stable** module list — default filter **mine** |
| Favorites | Filter on each entity list ([`favorites.md`](favorites.md)) |
| Chat | [`chat.md`](chat.md) |

## Feature IDs

| ID | Feature | Status |
|----|---------|--------|
| MG-01 | Home route after login = inbox (pending + waiting-transfer) | planned |
| MG-02 | Deep links from inbox to Connect / ownership-transfer / horse | planned |
| MG-03 | Empty inbox copy points to Horse / Stable modules | planned |
