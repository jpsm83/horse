# Horse Tabs

## Current Tab Structure (2026-07-20)

| Tab | Route | Visibility | Purpose |
|-----|-------|-----------|---------|
| Hub | `/horses/[id]` | Public | View-only dashboard with basic info, pedigree, ownership summary |
| Connect | `/horses/[id]/connect` | Admin (owner, co-owner, responsible) | Invite providers + manage connections table |
| Planning | `/horses/[id]/planning` | Public | Calendar for appointments, competitions, training, and daily activities. Shows events from connected providers. |
| Media | `/horses/[id]/media` | Public | Upload and view photos and videos. Drag-and-drop upload with thumbnail gallery and lightbox viewer. |
| Documents | `/horses/[id]/documents` | Public | Horse documents and files |
| Edit | `/horses/[id]/edit` | Admin (owner, co-owner, responsible) | Edit basic info + contact display |
| Admin | `/horses/[id]/sale` | Owner-only | Sale settings + ownership management + responsible persons + Hub toggle |
| History | `/horses/[id]/history` | Owner + entities | Activity/audit log |

## Removed Tabs

- **Events** — renamed to Planning (redirect from `/events` to `/planning`)
- **Discovery** — contact display moved to Edit tab; per-section visibility replaces global discovery
- **Relations** — merged into Connect tab (invites + connections + reviews)
- **Medical** — health records tab; removed for future rebuild. Tab entry, route, API, components, service, model, and translations deleted.
- **Feed** — feed plans tab; removed for future rebuild. Tab entry, route, API, components, service, model, and translations deleted.

## Business Rules

See AGENTS.md for critical business rules about entity registration requirements.

## Tab Order

```
[Hub] [Connect] [Planning] [Media] [Documents] [Edit] [Admin] [History]
```

Role-based access: Hub, Planning, Media, Documents, History → public. Connect, Edit → Admin (owner/co-owner/responsible). Admin → owner-only.
