# Horse Entity Tab Reorganization & Feature Expansion

**Date:** 2026-07-13
**Status:** Draft

## 1. Overview

Reorganize the horse entity detail pages from the current 6-tab layout into a comprehensive 10-tab structure. The horse is the central data hub of the Equus app — all other entities (vets, stables, trainers, etc.) relate to it. This spec covers tab restructuring, the new Connect tab, per-section visibility controls, new data models, and the Hub as a public-facing feed.

### Guiding Principles

- **Horse is the hub** — all data lives in horse-keyed collections with source entity attribution
- **Data never deleted** — soft deactivation only; relationships end, data persists
- **Owner controls everything** — owner can see and edit all horse data; related entities have scoped access
- **Per-section visibility** — each section within a tab has its own visibility control (owner-only, selected entities, public)
- **Reusable patterns** — table component, visibility popover, section headers reused across all tabs

## 2. Tab Architecture

### Tabs to Remove

| Tab | Action | Why |
|-----|--------|-----|
| Discovery | Remove | Contact display moves to Main tab; per-section visibility replaces global discovery |
| Relations | Remove | Merged into new Connect tab |

### Tabs to Keep

| Tab | Visibility | Changes |
|-----|-----------|---------|
| Hub | Public | Becomes a view-only aggregated feed of public data from all sections |
| Main | Owner-only | Remains for basic horse info editing (name, breed, contact display from Discovery) |
| Sale → Admin | Owner-only | Renamed; adds ownership management + Hub visibility toggle |
| History | Owner + related entities | Stays as activity/audit log |

### New Tabs

| Tab | Visibility | Content |
|-----|-----------|---------|
| Connect | Owner-only | Unified provider search + connections table (replaces Relations + Hub's Connect providers) |
| Medical | Owner + related entities | Health records (vet visits, vaccinations, medications) |
| Feed & Nutrition | Owner + related entities | Diet plans, feed schedule, supplements |
| Events | Owner + all related entities | Daily schedule, appointments, competitions, training |
| Media | Public (per-item controls) | Photos, videos with per-item visibility |
| Documents | Per-document | Registration, passports, insurance, contracts |

### Final Tab Order

```

[Hub] them organize the rest alphabeticaly ([Connect] [Medical] [Feed] [Events] [Media] [Documents] [Admin] [History])
```

Hub first, them organize the rest alphabeticaly

## 3.A Calendar component feature

### 3.1.A - NPM install

We must intall and setup properly the calendar and its feature from the npm:
https://www.npmjs.com/package/@fullcalendar/react

- we are not goint to implent and connect it right now but we must have it prepare so we will connect it later

## 3.B. Tab Details

### 3.B.1 Hub — Public Feed

View-only aggregated page showing a horse's publicly-visible data. No navigation to tabs, no inline editing.

**Layout:**
- Hero section: profile photo, name, breed, age, color
- Pedigree section (public, owner can edit via Admin tab)
- Summary cards from all sections set to "public" visibility
- Each card is a read-only snippet
- Single toggle on Admin tab: "Enable Hub page" (on/off)

**Owner experience:** Owner sees Hub exactly as public visitors see it (preview mode).

### 3.B.2 Connect Tab

Unified connection management — replaces Relations tab + Connect providers section from Hub.

#### 3.B.2a Invite Provider

Single search input that queries all entity types + users simultaneously.

- User types name, email, or username
- Search returns results from all entity types (veterinary, stable, trainer, groom, farrier, breeder, riding club, rider, coach, transport)
- Each result shows: name, entity type badge, email, [Invite] button
- If no result: offer email invitation to non-user
- **Business rule enforcement:** Email invites create pending relationships that only activate when the recipient signs up and creates their entity profile. An entity cannot interact with the horse until they are a registered user. See §1 Critical Business Rules.

#### 3.B.2b Connections Table

Reusable shadcn Table component showing all relationships.

**Columns:** Type, Status, Name, Email, Connected Since, Actions

**Features:**
- Filter supose to be individual at all the columns, the first row supose to be the header, the second row the filter, and the other rows the data
- Order by indiviaula collumns too on the click of the header
- double click event on rows to navigate around
- Reusable — same component for Ownership History on Admin tab and at many other places that need a table, will be only one reusable table to be use on the enterely app

**Also includes:** Reviews section (from current Relations tab).

### 3.B.3 Medical Tab

Health records attributed to source entities. here se must use both, the calendar component we installed and the table component we created, the calendar will show all the events while the table will show only the history

**Sections:** Vaccinations, Vet visits / Exams, Medications, Allergies

**Each record:** date, type, notes, source entity, visibility control, file attachments

**Data model:** `HorseHealthRecord`

### 3.B.4 Feed & Nutrition Tab

Diet management.

**Sections:** Daily feed schedule (AM/PM), Supplements, Diet notes/restrictions. here se must use both, the calendar component we installed and the table component we created, the calendar will show all the events while the table will show only the history

**Each plan:** meal time, feed type, quantity, supplements, source entity, visibility

**Data model:** `HorseFeedPlan`

### 3.B.5 Events Tab

Daily schedule and calendar. we can

**Sections:** Upcoming events (timeline), Past events, Competition results. here se must use both, the calendar component we installed and the table component we created, the calendar will show all the events while the table will show only the history

**Event types:** Appointment, Competition, Training, Other

**Each event:** date/time, type, title, location, notes, visibility, source entity

**Data model:** `HorseEvent`

### 3.B.6 Media Tab

Photos and videos extending existing gallery.

- Owner uploads and manages media
- Related entities can upload media attributed to them
- Per-item visibility
- Owner can override non-owner media visibility

**Data model:** `HorseMedia` collection

### 3.B.7 Documents Tab

Registration papers, passports, insurance, contracts.

- Owner and related entities can upload
- Per-document visibility
- Type categorization

**Data model:** `HorseDocument`

### 3.B.8 Main Tab

Basic horse identity fields: name, breed, sex, date of birth, color, height, disciplines, description, notes. Also contact display settings (moved from Discovery).

### 3.B.9 Admin Tab (renamed from Sale)

Horse configuration center.

**Content:**
1. **Sale settings** — price, sale status, currency, estimated value
2. **Ownership** — main owner, co-owners (transfer, promote, remove), person responsible
3. **Ownership history** — table (reusable), date/from/to/type
4. **Hub toggle** — single switch: "Enable Hub page"

### 3.B.10 History Tab

Audit log of all actions on the horse. Table with filters (action type, date range, actor). Visible to owner + related entities.

**Data model:** `HorseAuditLog`

## 4. Per-Section Visibility System

### 4.1 Data Model

Stored as a map on the Horse document:

```typescript
sectionVisibility: {
  [sectionKey: string]: {
    mode: "owner" | "entities" | "public";
    entityIds?: ObjectId[];
  }
}
```

### 4.2 UI Component: `SectionVisibilityPopover`

Reusable popover on each section header.

**Popover content:**
1. Visibility level selector: "Only the owner" / "Owner + selected entities" / "Public"
2. Entity search/selector (when "selected entities" chosen)
3. Badge on section: e.g., "Visible for: Veterinary, Stable"
4. Selector of individual users

## 5. Data Architecture

All horse-related data in collections keyed by `horseId`, attributed to source entity.

### 5.1 New Collections

| Collection | Key Indexes | Purpose |
|-----------|-------------|---------|
| `HorseHealthRecord` | `{horseId, date}`, `{sourceEntityId, sourceEntityType}` | Medical records |
| `HorseFeedPlan` | `{horseId, date}`, `{sourceEntityId, sourceEntityType}` | Feed schedules |
| `HorseEvent` | `{horseId, date}`, `{sourceEntityId, sourceEntityType}` | Events/calendar |
| `HorseMedia` | `{horseId}`, `{sourceEntityId, sourceEntityType}` | Media items |
| `HorseDocument` | `{horseId}`, `{sourceEntityId, sourceEntityType}` | Documents |
| `HorseAuditLog` | `{horseId, timestamp}` | Activity audit |

### 5.2 API Endpoints

All under `/api/v1/horses/:horseId/`:

```
GET/POST    /health           → HorseHealthRecord
PATCH/DELETE /health/:id
GET/POST    /feed             → HorseFeedPlan
PATCH/DELETE /feed/:id
GET/POST    /events           → HorseEvent
PATCH/DELETE /events/:id
GET/POST    /media            → HorseMedia
PATCH/DELETE /media/:id
GET/POST    /documents        → HorseDocument
PATCH/DELETE /documents/:id
GET         /audit            → HorseAuditLog (read-only)
GET/PATCH   /visibility       → sectionVisibility
```

## 6. Permission Model

| Role | View | Main |
|------|------|------|
| Main owner | Everything | Everything |
| Co-owner | Everything | Everything |
| Person responsible | Everything | Assigned sections |
| Related entity (vet) | Medical, Feed, Events, History | Their own records |
| Related entity (stable) | Feed, Events, History | Their own records |
| Public | Hub (public sections only) | Nothing |

Centralized permission service: `canViewSection(horseId, userId, sectionKey)`, `canEditRecord(record, userId)`.

**Important:** Only registered Equus users with claimed entity profiles can be selected in the section visibility entity selector. Non-users cannot appear as entities in the app — they must sign up first (see §1 Critical Business Rules).

## 7. Reusable Components

### 7.1 Reusable Data Table

shadcn Table extended with sortable columns, filter toolbar (type/status/date), pagination, row actions.

Used by: Connect (connections), Admin (ownership history), Medical, History.

### 7.2 SectionVisibilityPopover

As described in §4.2. Used on every content section.

### 7.3 Entity Search Input

Unified search (name/email/username) across all entity types. Used by Connect tab.

## 8. Implementation Phasing

### Phase 0: Documentation & Business Rule Foundation
1. Update all existing documentation to reflect the core business rule (entities must be Equus users; horses have no restriction)
2. Add documentation for new tab structure, permission model, and visibility system
3. Add inline code comments about the business rule in key files (connect tab, permission service, invite flows)
4. Move this spec from `.opencode/plans/` to `docs/superpowers/specs/` on first implementation commit

### Phase 1: Foundation
1. Create reusable Data Table component
2. Create SectionVisibilityPopover component
3. Create unified Entity Search component
4. Update horseTabs config (add Connect, remove Relations, Discovery)
5. Move Connect providers from Hub → Connect tab
6. Merge Relations content into Connect tab
7. Rename Sale → Admin, add ownership + Hub toggle
8. Hub becomes view-only public feed

### Phase 2: Medical + Feed tabs
1. `HorseHealthRecord` model + API
2. `HorseFeedPlan` model + API
3. Medical tab UI
4. Feed tab UI

### Phase 3: Events tab
1. `HorseEvent` model + API
2. Events tab UI (timeline/calendar)

### Phase 4: Media + Documents tabs
1. `HorseMedia` collection + API
2. `HorseDocument` model + API
3. Media tab UI (gallery grid)
4. Documents tab UI

### Phase 5: History + Audit
1. Audit log service
2. `HorseAuditLog` model
3. History tab UI

## 9. Documentation Requirements

All documentation across the codebase must be updated to reflect:

- **The core business rule** (entities must be Equus users; horses have no restriction) — every relevant doc must state this clearly
- **New tab structure** — replace old Hub/Relations/Discovery docs with new Connect/Admin/etc.
- **Permission model** — document who can view/edit what across all sections
- **Visibility system** — explain per-section controls with code examples
- **Data architecture** — document the Option C pattern (horse-keyed collections with source entity attribution)
- **API endpoints** — document all new endpoints under `/api/v1/horses/:horseId/`

Key files to update:
- `AGENTS.md` — add business rule to project context
- All existing `.md` files in `documentation/` that reference horse tabs or entity interactions
- New files: `documentation/horseTabs.md`, `documentation/visibilitySystem.md`, `documentation/horseConnect.md`
