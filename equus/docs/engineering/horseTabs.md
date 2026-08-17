# Horse tabs

**Job:** Routes, `viewerRole` → `allowedTabs`, Hub vs ops tabs.  
**Upstream:** [`../features/horseModule.md`](../features/horseModule.md) (tab names locked)  
**Status:** **aligned**  
**Code roots:** `lib/navigation/horseTabs.ts`, `lib/services/horseService.ts` (`TAB_MIN_ROLE`), `app/[locale]/horses/[horseId]/`, `components/horses/`

Page files: [`page-flow-blueprint.md`](page-flow-blueprint.md).

---

## Shipped

Order: Hub · Connect · Planning · Media · Documents · Profile · Admin · History.

| Tab | Route | Min `viewerRole` |
|-----|-------|------------------|
| Hub | `/horses/[id]` | `guest` |
| Connect | `…/connect` | `responsible` |
| Planning | `…/planning` | `related` |
| Media | `…/media` | `related` |
| Documents | `…/documents` | `related` |
| Profile | `…/profile` | `responsible` |
| Admin | `…/admin` | `main_owner` |
| History | `…/history` | `responsible` |

Guest: Hub only (`EntityTabs` hides when only Hub). Server returns `allowedTabs`; client renders that list (`getHorseTabs`). Fallback while loading: `[hub]` only. `viewerRole` order: `guest` → `public` → `related` → `responsible` → `co_owner` → `main_owner`.

Hub is read-only social (`components/horses/hub/`). Chrome: `useHorseView`. Gallery: `useHorseHubGallery`. Visibility popovers: [`../conventions/visibility.md`](../conventions/visibility.md).

Removed routes redirect: `/edit` → Profile, `/events` → Planning. Medical/Feed/competition-results tabs are gone — do not resurrect as horse **ops** tabs (those writes belong on the entity).
