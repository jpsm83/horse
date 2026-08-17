# Later modules (post-launch entities)

**Job:** Shared view/discovery pattern for modules **not** in the production launch gate.  
**Upstream:** [`../product/graph-and-identity.md`](../product/graph-and-identity.md), [`../product/mvpScope.md`](../product/mvpScope.md)  
**Status:** **aligned** (CRUD/view shipped; they are not launch SaaS)  
**Code roots:** `app/api/v1/{breeders,transports,riding-clubs,trainers,grooms,veterinaries,farriers,coaches,riders}/`, matching `lib/services/*Service.ts`

Launch APIs: [`horses.md`](horses.md), [`stables.md`](stables.md). Naming: [`../conventions/ui-layout-naming.md`](../conventions/ui-layout-naming.md). At launch these people are **Users** who **collaborate** at a stable ([`workplace.md`](workplace.md)) or a direct horse `Relationship` ([`relationships.md`](relationships.md)). Full paid SaaS per module is post-launch.

---

## Shipped

Each type:

| Method | Path |
|--------|------|
| `POST` | `/api/v1/<plural>` |
| `GET` | `/api/v1/<plural>/:id` → `{ viewerRole, allowedTabs, <entity> }` |
| `PATCH` | `/api/v1/<plural>/:id/discovery` |

Deny → **404**. Contact fields live on the **profile**, not `User.preferences`.

| Kind | Types | Ownership |
|------|--------|-----------|
| Entity-owned | breeder, transport, riding club | `mainOwnerUserId` / `coOwners[]`; may host `WorkplaceRelationship` |
| User-linked | trainer, groom, veterinary, farrier, coach, rider | `userId` + `User.*ProfileId`; second `POST` → **409**; no `coOwners[]` / host workplace |

Discovery: `isPublic` (default true). Private: owner (and accepted horse `Relationship` where that type is a provider). Hosts also visible to active workplace collaborators.

When a later module becomes paid SaaS, copy the **stable** pattern: entity subscription, ops writes on that entity, horse page remains display. Do not bill them on the stable’s invoice.
