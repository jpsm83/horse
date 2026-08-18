# Stables API

**Job:** Stable REST. Launch paid SaaS module — ops writes live **here**.  
**Upstream:** [`../features/stableModule.md`](../features/stableModule.md)  
**Status:** **aligned** (shipped profile/discovery); **Target ops not built**  
**Code roots:** `app/api/v1/stables/`, `lib/services/stableService.ts`, `lib/stables/stableDiscoveryAccess.ts`, `models/Stable.ts`

Workplace: [`workplace.md`](workplace.md). Billing: [`billing.md`](billing.md). Horse display: [`horses.md`](horses.md).

---

## Shipped

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/v1/stables` | List (owner's stables) |
| `POST` | `/api/v1/stables` | Create (`mainOwnerUserId` = session) |
| `GET` | `/api/v1/stables/:id` | `{ viewerRole, allowedTabs, stable }` |
| `PATCH` | `/api/v1/stables/:id` | Owner field patch |
| `PATCH` | `/api/v1/stables/:id/discovery` | `isPublic`, `acceptsNewHorses` |

`isPublic: false` → visible to owner/co-owner, active workplace collaborators, or users with accepted horse↔stable `Relationship`. Business contact lives on **Stable**, not `User.preferences`. 404 when discovery denies.

Collaboration: `/api/v1/role-profiles/stable/:id/workplace-relationships`.

UI tabs: Hub / Profile / Admin only (`getStableTabs`).

**List UI:** `/stables` — owned stables; Favorites **filter** shipped ([`favorites.md`](favorites.md)).

---

## Target

Missing: roster, stalls, whiteboard/tasks, health, feed, docs, finance, facilities — **writes on this module**. Horse Planning/Documents only **display** saved rows ([`horses.md`](horses.md)).

Gate writes on good standing ([`billing.md`](billing.md)). Stable-created boarded horse → waiting-transfer on the horse ([`horses.md`](horses.md) Target).

**Aligned (Block 23):** Shipped REST + tabs match docs. No ops APIs or tabs invented.
