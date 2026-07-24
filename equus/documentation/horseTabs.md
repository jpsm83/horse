# Horse Tabs

## Current Tab Structure (2026-07-24)

| Tab | Route | Visibility | Purpose |
|-----|-------|-----------|---------|
| Hub | `/horses/[id]` | Public (Layer 1) | Filtered social page from `GET …/hub` — only allowed Hub sections |
| Connect | `/horses/[id]/connect` | Admin (owner, co-owner, responsible) | Invite providers + manage connections table. Connections Layer-2 `hubSections.connections` via `HorseSectionVisibility`. |
| Planning | `/horses/[id]/planning` | Public | Calendar for appointments, competitions, training, and daily activities. Layer-2 `hubSections.planning` via `HorseSectionVisibility` (admin-only popover). Create events: admin only. Shows events from connected providers. |
| Media | `/horses/[id]/media` | Public | Upload/view photos and videos. Gallery Layer-2 `hubSections.gallery` via `HorseSectionVisibility` (admin-only popover). Direct delete: owner, co-owner, responsible. Others request deletion (representatives decide when present). |
| Documents | `/horses/[id]/documents` | Public | Horse documents and files. Same delete/request policy as Media. |
| Profile | `/horses/[id]/profile` | Admin (owner, co-owner, responsible) | Edit identity / identification / pedigree / about (disciplines multi-select in About). Parent-owned form, single Save, unsaved-changes guard |
| Admin | `/horses/[id]/admin` | Owner-only | Visibility (`profileVisibility` via discovery API) + sale settings (parent-owned form + Save) + ownership / responsible actions (immediate mutations) |
| History | `/horses/[id]/history` | Admin (owner, co-owner, responsible) | Activity/audit log. Columns: user (avatar), username, email, type, action, date. |

## Removed Tabs

- **Edit** — renamed to Profile (redirect from `/edit` to `/profile`)
- **Events** — renamed to Planning (redirect from `/events` to `/planning`)
- **Discovery** — former standalone tab; contact display / ageYears / marksDescription removed from the Horse model. **Admin Visibility** edits Layer-1 `profileVisibility` (`HorseVisibilitySection` → form Save → `PATCH …/discovery`). **Section popovers** use shared `HorseSectionVisibility` in the `Section` `visibilityControl` slot (Layer-2 `hubSections`, including Admin `value` / `proactiveRepresentatives` / `coOwnerManagement`, Media `gallery`, Planning `planning`, and Connect `connections`) → `PATCH …/hub-sections` — not parent form state and not the discovery route.
- **Relations** — merged into Connect tab (invites + connections + reviews)
- **Medical** — health records tab; removed for future rebuild. Tab entry, route, API, components, service, model, and translations deleted.
- **Feed** — feed plans tab; removed for future rebuild. Tab entry, route, API, components, service, model, and translations deleted.
- **Competition results** — removed from Profile tab, Horse model (`competitionResults[]`), APIs, services, hooks, and translations. Not planned.

## Component layout

Horse tab UI lives under `components/horses/<tab>/` with a `horse-` filename prefix. Cross-tab horse helpers: `components/horses/shared/`. App-wide primitives: `components/shared/`. See [`page-flow-blueprint.md`](./page-flow-blueprint.md) §1.

## First delivery — Hub as social surface

First delivery prioritizes **user + horse details for social interaction** and **stable SaaS**. The Hub tab is the primary public social surface for a horse (utility-first; not a global Instagram feed).

Hub reads a **filtered DTO** (`GET /api/v1/horses/:id/hub`): Layer 1 (`profileVisibility`) gates access; Layer 2 (`hubSections`) decides which blocks appear. See [`horses.md`](./horses.md) two-layer visibility.

Market-derived Hub/profile backlog (`H-FD-*`): [`../../documentation/horseModule.md`](../../documentation/horseModule.md) §14 and [`../../documentation/firstDeliveryCompetitiveBacklog.md`](../../documentation/firstDeliveryCompetitiveBacklog.md).  
Stable SaaS backlog (`S-FD-*`): [`../../documentation/stableModule.md`](../../documentation/stableModule.md) §12.

## Business Rules

See AGENTS.md for critical business rules about entity registration requirements.

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

Role-based access: Hub, Planning, Media, Documents → public. Connect, Profile, History → Admin (owner/co-owner/responsible). Admin → owner-only.
