# Horse Tabs

## Current Tab Structure (2026-07-25)

| Tab | Route | Minimum Role | Purpose |
|-----|-------|-------------|---------|
| Hub | `/horses/[id]` | `guest` | Read-only social profile page — hero, stats, about, gallery, upcoming events, pedigree, team, identification. Data from `useHorseView`. No visibility popovers. Only tab visible to unauthenticated/guest users; EntityTabs auto-hides entirely when only hub is available. |
| Connect | `/horses/[id]/connect` | `responsible` | Invite providers + manage connections table (Admin History `DataTable` pattern). Connections Layer-2 `hubSections.connections` via `HorseSectionVisibility` (also Hub). |
| Planning | `/horses/[id]/planning` | `related` | Calendar management. Layer-2 `hubSections.planning` via popover + Hub block. Create: ownership team only. Owner team sees full list; others filtered. |
| Media | `/horses/[id]/media` | `related` | Upload/view photos and videos. Gallery Layer-2 `hubSections.gallery` via popover + Hub block. Owner team sees full list; others filtered. |
| Documents | `/horses/[id]/documents` | `related` | Horse documents and files (Admin History `DataTable` pattern). Same delete/request policy as Media. |
| Profile | `/horses/[id]/profile` | `responsible` | Edit identity / identification / pedigree / about (disciplines multi-select in About). Parent-owned form, single Save, unsaved-changes guard. |
| Admin | `/horses/[id]/admin` | `main_owner` | Visibility (`profileVisibility` via discovery API) + sale settings (parent-owned form + Save) + ownership / responsible actions (immediate mutations). History table is the visual SoT for horse `DataTable`s. |
| History | `/horses/[id]/history` | `responsible` | Activity/audit log (Admin History `DataTable` pattern). Columns: user (avatar), username, email, type, action, date. |

## Tab access via `viewerRole` and `allowedTabs`

Tab access is **server-determined**. The unified `GET /api/v1/horses/:id` returns `allowedTabs[]` based on the viewer's `viewerRole`. The client renders only the tabs returned by the server — no role inference on the client.

`viewerRole` values (in ascending privilege):
```
guest → public → related → responsible → co_owner → main_owner
```

Minimum role map (`TAB_MIN_ROLE` in `lib/services/horseService.ts`):

| Tab | Minimum viewerRole |
|-----|--------------------|
| hub | `guest` |
| planning | `related` |
| media | `related` |
| documents | `related` |
| connect | `responsible` |
| profile | `responsible` |
| history | `responsible` |
| admin | `main_owner` |

`getHorseTabs(horseId, allowedTabs)` in `lib/navigation/horseTabs.ts` filters the full tab list to only those in `allowedTabs`. Falls back to `[hub]` only when `allowedTabs` is undefined (cache miss during loading) — showing nothing rather than wrong tabs.

## Removed Tabs

- **Edit** — renamed to Profile (redirect from `/edit` to `/profile`)
- **Events** — renamed to Planning (redirect from `/events` to `/planning`)
- **Discovery** — former standalone tab; contact display / ageYears / marksDescription removed from the Horse model. **Admin Visibility** edits Layer-1 `profileVisibility` (`HorseVisibilitySection` → form Save → `PATCH …/discovery`). **Section popovers** use shared `HorseSectionVisibility` in the `Section` `visibilityControl` slot (Layer-2 `hubSections`) → `PATCH …/hub-sections`.
- **Relations** — merged into Connect tab (invites + connections + reviews)
- **Medical** — health records tab; removed for future rebuild.
- **Feed** — feed plans tab; removed for future rebuild.
- **Competition results** — removed from Profile tab and Horse model.

## Component layout

Horse tab UI lives under `components/horses/<tab>/` with a `horse-` filename prefix. Cross-tab horse helpers: `components/horses/shared/`. App-wide primitives: `components/shared/`. Hub components: `components/horses/hub/horse-hub-*.tsx`. See [`page-flow-blueprint.md`](./page-flow-blueprint.md) §1.

**Tables:** Connect, Documents, History, and Admin share one `DataTable` system (`components/table`) and the Admin History visual pattern (`TableUserAvatarCell`, row/icon actions, required filter/sort/columnOrder props). See [`page-flow-blueprint.md`](./page-flow-blueprint.md) §6 (Horse entity tables).

## Hub tab — social profile page

The Hub tab is a **read-only social profile** for the horse. Redesigned as a social media-style page. No `HorsePageShell` — no ownership gate.

**Data split:**
- Shared chrome (`useHorseView` / layout-seeded): role, tabs, horse fields, cheap `horse.sections` (`identity`, `identification`, `pedigree`, `about`, `ownership`). Absent keys mean the viewer lacks access or the owner hid the section.
- Hub social lists (`useHorseHubSocial` → `GET …/hub-social`, guest-safe): `gallery`, `planning`, `connections`. Not seeded by horse layout — Hub zones own this fetch when wired. Separate from Media / Planning / Connect management tab APIs (auth required).

Layout: full-width hero, then a three-column body on `lg` (left details ≈25%, center media ≈45%, right pedigree/people ≈30%); stacked on smaller screens.

Components (all read-only, no visibility popovers; under `components/horses/hub/`):
```
HubContent (reads useHorseView — cache hit from layout.tsx)
├── HorseHubHero          — cover (heroImageUrl), avatar (profileImageUrl), flag, name, Share; owners upload via ProfilePhotoField
├── Left column
│   ├── HorseHubAbout         — metadata / identity details list
│   ├── HorseHubDisciplines   — discipline tags
│   └── HorseHubDescription  — biography text
├── Center column
│   └── HorseHubGallery      — media grid (photos/videos) → useHorseHubSocial when wired
└── Right column
    ├── HorseHubPedigree     — sire/dam + bloodline notes
    └── HorseHubPeople       — owner, co-owners, representatives
```

Owners set Hub images from Media tiles (Popover: set as profile / hero) or Hub `ProfilePhotoField` (upload → Media + PATCH `profileImageUrl` / `heroImageUrl`).

Deferred (not in current Hub shell): upcoming planning events block.

Market-derived Hub/profile backlog (`H-FD-*`): [`../../documentation/horseModule.md`](../../documentation/horseModule.md) §14.

## Deferred form tabs (Profile, Admin)

Profile and Admin sale/visibility settings use a **parent-owned form**:

- One `useForm` in `client.tsx`, one Save button at the bottom of the tab, dirty → unsaved-changes dialog on tab leave
- Field sections (including Admin Visibility) receive `control` only — no per-section Save
- Immediate actions (invites, remove member, ownership transfer) stay in their section components

Canonical rules: [`page-flow-blueprint.md`](./page-flow-blueprint.md) §6.5.

## Tab Order

```
[Hub] [Connect] [Planning] [Media] [Documents] [Profile] [Admin] [History]
```

Only `allowedTabs` from the server response are rendered. Tabs not in `allowedTabs` are not shown.

## Business Rules

See AGENTS.md for critical business rules about entity registration requirements.
