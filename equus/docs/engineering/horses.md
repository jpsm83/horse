# Horses API

**Job:** Horse REST + visibility. Horse page is **display**; ops writes belong on the entity.  
**Upstream:** [`../features/horseModule.md`](../features/horseModule.md)  
**Status:** **drift** (entity-sourced planning aggregation + waiting-transfer not built; horse POST limited to owner personal events)  
**Code roots:** `app/api/v1/horses/`, `lib/services/horseService.ts`, `lib/horses/horseVisibilityAccess.ts`, `models/Horse.ts`

Tabs: [`horseTabs.md`](horseTabs.md). Relationships: [`relationships.md`](relationships.md). Lifecycle: [`dataLifecycle.md`](dataLifecycle.md).

---

## Shipped

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/v1/horses?mine=true` | List; `mine` = owned/co-owned; guests get public horses |
| `POST` | `/api/v1/horses` | Create (`mainOwnerUserId` = session). **Free** — no owner-tier horse-count cap ([`billing.md`](billing.md) entity billing is separate) |
| `GET` | `/api/v1/horses/:id` | `{ viewerRole, allowedTabs, horse }` — cheap Hub sections only |
| `GET` | `/api/v1/horses/:id/hub-social` | Hub lists `{ gallery?, planning?, connections? }` |
| `GET` | `/api/v1/horses/:id/hub-gallery` | Paginated Hub media |
| `PATCH` | `/api/v1/horses/:id` | Owner identity/profile fields |
| `PATCH` | `/api/v1/horses/:id/discovery` | Layer-1 `profileVisibility` |
| `PATCH` | `/api/v1/horses/:id/hub-sections` | Layer-2 `hubSections` (autosave) |
| `GET`/`POST` | `/api/v1/horses/:id/planning` | List events; **POST** owner-team **personal** events only (no entity ops / feed on horse) |
| `GET` | `/api/v1/horses/:id/audit` | History |
| `GET`/`POST`/`DELETE` | `/api/v1/horses/:id/media…` | Gallery; Cloudinary hard-delete (file-asset exception) |
| `GET`/`POST`/`PATCH`/`DELETE` | `…/media-deletion-requests` | Non-owner delete requests |
| `GET`/`POST`/`DELETE` | `/api/v1/horses/:id/documents…` | Files; same delete policy as media |
| `GET` | `/api/v1/horses/search` | Horse search (module search — allowed) |

`allowedTabs` / `viewerRole`: [`horseTabs.md`](horseTabs.md). Pending outbound invites: [`relationships.md`](relationships.md).

**Visibility:** L1 `profileVisibility` (deny → 404) via `PATCH …/discovery`. L2 `hubSections[key].mode` (`public` \| `relationship` \| `owner`) via `PATCH …/hub-sections` (autosave). Enforce in `lib/horses/horseVisibilityAccess.ts`.

Audience: owner = ownership team (`userOwnsEntity`). relationship = team + accepted `Relationship` + active host-entity workplace collaborators. Tabs stay role-based (`allowedTabs`); L1/L2 are independent of role.

Hub cheap keys: `identity` \| `identification` \| `pedigree` \| `about` \| `ownership` \| `value` \| `proactiveRepresentatives` \| `coOwnerManagement`. List keys on `GET …/hub-social`: `gallery` \| `planning` \| `connections`. Item mode `entities` maps to `relationship`. Hub renders only keys present in `horse.sections`; media/planning lists enforce L1→L2 (owner team full list).

Public contact from main owner via `lib/privacy/userVisibility.ts`. How to write the control: [`../conventions/visibility.md`](../conventions/visibility.md).

**List UI:** `/horses` — authenticated default owned; guests public. Create: `/horses/new` (media upload then `POST /horses`). Hub: `/horses/[id]`.

---

## Target

- **Reads** on horse: Hub, aggregated Planning/Documents/History, Connect, identity.  
- **Writes** for care, invoices, feed, whiteboard, roster: **stable (entity) APIs** — horse `POST …/planning` is **owner personal events only** until entity ops exist. Owner “reply” on an event = [`chat.md`](chat.md).  
- Waiting-transfer flag + daily nag when a stable creates a boarded horse (creating user temporary `mainOwner`).  
- List default stays **mine**; add Favorites **filter** ([`favorites.md`](favorites.md)).  
- Do not add owner Equus subscription or horse-count caps on `POST /horses`.
