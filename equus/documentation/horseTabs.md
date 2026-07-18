# Horse Tabs

## Current Tab Structure (2026-07-15)

| Tab | Route | Visibility | Purpose |
|-----|-------|-----------|---------|
| Hub | `/horses/[id]` | Public | View-only dashboard with basic info, pedigree, ownership summary |
| Connect | `/horses/[id]/connect` | Owner-only | Invite providers + manage connections table |
| Planning | `/horses/[id]/planning` | Public | Calendar for appointments, competitions, training, and daily activities. Shows events from connected providers. |
| Media | `/horses/[id]/media` | Public | Upload and view photos and videos. Drag-and-drop upload with thumbnail gallery and lightbox viewer. |
| Documents | `/horses/[id]/documents` | Public | Horse documents and files |
| Medical | `/horses/[id]/health` | Owner-only | Health records and medical history |
| Feed | `/horses/[id]/feed` | Owner-only | Feed plans and nutrition schedules |
| Edit | `/horses/[id]/edit` | Owner-only | Edit basic info + contact display |
| Admin | `/horses/[id]/sale` | Owner-only | Sale settings + ownership management + Hub toggle |
| History | `/horses/[id]/history` | Owner + entities | Activity/audit log |

## Removed Tabs

- **Events** — renamed to Planning (redirect from `/events` to `/planning`)
- **Discovery** — contact display moved to Edit tab; per-section visibility replaces global discovery
- **Relations** — merged into Connect tab (invites + connections + reviews)

## Business Rules

See AGENTS.md for critical business rules about entity registration requirements.

## Tab Order

```
[Hub] [Connect] [Planning] [Media] [Documents] [Medical] [Feed] [Edit] [Admin] [History]
```

Public-visible tabs first, owner-only admin tabs toward the end.
