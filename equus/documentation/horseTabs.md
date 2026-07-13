# Horse Tabs

## Current Tab Structure (2026-07-13)

| Tab | Route | Visibility | Purpose |
|-----|-------|-----------|---------|
| Hub | `/horses/[id]` | Public | View-only dashboard with basic info, pedigree, ownership summary |
| Connect | `/horses/[id]/connect` | Owner-only | Invite providers + manage connections table |
| Edit | `/horses/[id]/edit` | Owner-only | Edit basic info + contact display |
| Admin | `/horses/[id]/sale` | Owner-only | Sale settings + ownership management + Hub toggle |
| History | `/horses/[id]/history` | Owner + entities | Activity/audit log |

## Removed Tabs

- **Discovery** — contact display moved to Edit tab; per-section visibility replaces global discovery
- **Relations** — merged into Connect tab (invites + connections + reviews)

## Business Rules

See AGENTS.md for critical business rules about entity registration requirements.

## Tab Order

```
[Hub] [Connect] [Edit] [Admin] [History]
```

Public-visible tabs first, owner-only admin tabs toward the end. Future tabs (Medical, Feed, Events, Media, Documents) will be added between Connect and Edit.
