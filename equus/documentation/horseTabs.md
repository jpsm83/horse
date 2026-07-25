# Horse Tabs

## Current Tab Structure (2026-07-25)

| Tab | Route | Minimum Role | Purpose |
|-----|-------|-------------|---------|
| Hub | `/horses/[id]` | `guest` | Read-only social profile page — hero, stats, about, gallery, upcoming events, pedigree, team, identification. Data from `useHorseView`. No visibility popovers. |
| Connect | `/horses/[id]/connect` | `responsible` | Invite providers + manage connections table. Connections Layer-2 `hubSections.connections` via `HorseSectionVisibility` (also Hub). |
| Planning | `/horses/[id]/planning` | `guest` (view) | Calendar management. Layer-2 `hubSections.planning` via popover + Hub block. Create: ownership team only. Owner team sees full list; others filtered. |
| Media | `/horses/[id]/media` | `guest` (view) | Upload/view photos and videos. Gallery Layer-2 `hubSections.gallery` via popover + Hub block. Owner team sees full list; others filtered. |
| Documents | `/horses/[id]/documents` | `guest` | Horse documents and files. Same delete/request policy as Media. |
| Profile | `/horses/[id]/profile` | `responsible` | Edit identity / identification / pedigree / about (disciplines multi-select in About). Parent-owned form, single Save, unsaved-changes guard. |
| Admin | `/horses/[id]/admin` | `main_owner` | Visibility (`profileVisibility` via discovery API) + sale settings (parent-owned form + Save) + ownership / responsible actions (immediate mutations). |
| History | `/horses/[id]/history` | `responsible` | Activity/audit log. Columns: user (avatar), username, email, type, action, date. |

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
| planning | `guest` |
| media | `guest` |
| documents | `guest` |
| connect | `responsible` |
| profile | `responsible` |
| history | `responsible` |
| admin | `main_owner` |

`getHorseTabs(horseId, allowedTabs)` in `lib/navigation/horseTabs.ts` filters the full tab list to only those in `allowedTabs`. Falls back to legacy `requireOwnership`/`requireMainOwner` flags when `allowedTabs` is undefined (cache miss).

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

## Hub tab — social profile page

The Hub tab is a **read-only social profile** for the horse. Redesigned as a social media-style page. No `HorsePageShell` — no ownership gate. Sections render only when present in `horse.sections` (server already filtered by L1+L2 visibility for the viewer).

Components (all read-only, no visibility popovers):
```
HubContent (reads useHorseView — cache hit from layout.tsx)
├── HorseHubHero          — cover/profile image, name, breed, sex, location
├── HorseHubStats         — age, color, height as highlight cards; discipline tags
├── HorseHubAbout         — description
├── HorseHubGallery       — masonry/grid photo gallery with lightbox
├── HorseHubUpcomingEvents — next 5 planning events
├── HorseHubPedigree      — sire/dam/bloodline callout
├── HorseHubTeam          — ownership count + connections list
└── HorseHubIdentification — registry/microchip/passport
```

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
