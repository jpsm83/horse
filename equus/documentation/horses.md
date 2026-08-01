# Horses API (`/api/v1/horses`)

Reference for minimal horse endpoints and discovery visibility behavior.

Related:
- [`../../documentation/userModule.md`](../../documentation/userModule.md) — includes §12 first-delivery social backlog (`U-FD-*`)
- [`../../documentation/horseModule.md`](../../documentation/horseModule.md) — full horse module spec; §14 first-delivery social backlog (`H-FD-*`)
- [`../../documentation/stableModule.md`](../../documentation/stableModule.md) — barn operations on hosted horses; §12 first-delivery SaaS backlog (`S-FD-*`)
- [`../../documentation/firstDeliveryCompetitiveBacklog.md`](../../documentation/firstDeliveryCompetitiveBacklog.md) — market extract for first delivery
- [`../../documentation/appCompetition/webapps.md`](../../documentation/appCompetition/webapps.md) — competitive benchmark
- [`stables.md`](./stables.md)
- [`breeders.md`](./breeders.md)
- [`profile.md`](./profile.md)

---

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/v1/horses?mine=true&page=1&limit=20` | List horses — optional auth; `mine` filters to owned/co-owned for authenticated users; returns public horses for guests |
| `POST` | `/api/v1/horses` | Create a horse owned by the authenticated user (`mainOwnerUserId`, `createdByUserId`) |
| `GET` | `/api/v1/horses/:id` | **Unified role-aware horse view** — returns `{ viewerRole, allowedTabs, horse }` (replaces the retired `/owner` and `/hub` endpoints). Auth optional; `viewerRole` determines payload scope. Slim chrome: cheap Hub section projections only — **no** gallery/planning/connections lists. |
| `GET` | `/api/v1/horses/:id/hub-social` | **Hub social lists** (guest-safe) — `{ sections: { gallery?, planning?, connections? } }` filtered by L1+L2. Auth optional. Hub tab only — not seeded by horse layout. Full gallery array (legacy/companion); prefer `hub-gallery` for Hub Media UI. |
| `GET` | `/api/v1/horses/:id/hub-gallery` | **Paginated Hub Media** — `{ items, total, page, pageSize }` with `page`, `pageSize` (1–24), `type=all\|photos\|videos`. Hub-visible only (`isVisibleOnHub`), audience `visibilityMode`, Layer-2 `gallery`. Auth optional. |
| `PATCH` | `/api/v1/horses/:id` | Owner profile field patch (not section visibility) |
| `GET` | `/api/v1/horses/:id/relationships?status=pending` | Outbound pending invites sent by the owner for this horse |
| `PATCH` | `/api/v1/horses/:id/discovery` | Layer-1 `profileVisibility` only (Admin Visibility form Save) |
| `PATCH` | `/api/v1/horses/:id/hub-sections` | Layer-2 partial `hubSections` (section popover autosave) |
| `GET` | `/api/v1/horses/:id/planning` | List planning events (auth required) |
| `POST` | `/api/v1/horses/:id/planning` | Create planning event (admin / `userOwnsEntity` only; Zod body) |
| `GET` | `/api/v1/horses/:id/audit` | Audit/history logs (admin / `userOwnsEntity` only) |
| `GET` | `/api/v1/horses/:id/media` | List media items (images/videos) for a horse |
| `POST` | `/api/v1/horses/:id/media` | Create a media record (url, type, title, etc.) |
| `DELETE` | `/api/v1/horses/:id/media/:mediaId` | Delete a media record + Cloudinary file (owner only, hard-delete) |
| `GET` | `/api/v1/horses/:id/media-deletion-requests?status=pending` | List pending deletion requests (owner/co-owner only) |
| `POST` | `/api/v1/horses/:id/media-deletion-requests` | Request deletion of a media item (non-owners) — creates pending request for owner approval |
| `PATCH` | `/api/v1/horses/:id/media-deletion-requests/:requestId` | Approve or decline a deletion request (owner/co-owner only) |
| `DELETE` | `/api/v1/horses/:id/media-deletion-requests/:requestId` | Cancel own pending deletion request (requester only) |

### `GET /api/v1/horses/:id` — response shape

```ts
type HorseViewResponse = {
  viewerRole: "main_owner" | "co_owner" | "responsible" | "related" | "public" | "guest";
  allowedTabs: Array<"hub" | "connect" | "planning" | "media" | "documents" | "profile" | "admin" | "history">;
  horse: HorseViewDto; // owner fields present only for ownership-team viewers
};
```

`horse.sections` on this endpoint holds **cheap Hub projections** only (`identity`, `identification`, `pedigree`, `about`, `ownership`, `value`, `proactiveRepresentatives`, `coOwnerManagement`) — field slices from the horse document after L1+L2. It does **not** include `gallery` / `planning` / `connections` lists (those require Media / Event / Relationship queries).

Guest-visible chrome also includes `profileImageUrl` and `heroImageUrl` (Hub avatar + cover). Owners set them from Hub (`ProfilePhotoField` upload → media + PATCH) or Media tab (“Set as profile/hero”).

### `GET /api/v1/horses/:id/hub-social` — Hub list payload

```ts
type HorseHubSocialResponse = {
  sections: {
    gallery?: HorseHubGalleryItem[];
    planning?: HorseHubPlanningItem[];
    connections?: HorseHubConnectionItem[];
  };
};
```

Auth optional (same L1 rules as the horse view). Used by Hub zones via `useHorseHubSocial` — not by Media / Planning / Connect management tabs (those keep their auth-required list APIs).

`viewerRole` derivation (server-side):
- `main_owner` — `horse.mainOwnerUserId === userId`
- `co_owner` — userId in `horse.coOwners[]`
- `responsible` — userId in `horse.responsibles[]` (ownership team but not owning stake)
- `related` — accepted `Relationship` or active collaboration on a linked host entity
- `public` — authenticated but no relationship
- `guest` — unauthenticated

`allowedTabs` is computed from `viewerRole` via `TAB_MIN_ROLE` in `lib/services/horseService.ts`. Client reads directly from the response — no role inference on the client.

### Hub tab — social profile page

The Hub tab at `/horses/[horseId]` is a **read-only social profile** for the horse. It reads the slim horse view from the TanStack cache (seeded by `layout.tsx` RSC — no Media/Event/Relationship queries). Cheap `horse.sections` keys gate presence for identity/about/pedigree/etc. Hub **Media** loads via `GET /api/v1/horses/:id/hub-gallery` (`useHorseHubGallery`) with pagination sized to the responsive grid. Planning / connections lists still use `GET …/hub-social` when those zones are wired.

Layout: full-width hero, then a three-column body on `lg` (left details, center media, right pedigree/people); stacked on smaller screens.

Components under `components/horses/hub/`:
```
HubContent
├── HorseHubHero          — cover, avatar, name, quick stats, actions  (useHorseView)
├── Left column
│   ├── HorseHubAbout         — profile description  (useHorseView sections)
│   ├── HorseHubDisciplines   — discipline tags
│   └── HorseHubValue         — read-only sale/value fields
├── Center column
│   └── HorseHubGallery      — media grid → useHorseHubSocial (when wired)
└── Right column
    ├── HorseHubPedigree     — sire/dam + bloodline notes
    └── HorseHubPeople       — owner, co-owners, representatives
```

Deferred: upcoming planning events block (would also use hub-social `planning`).

- Page: `app/[locale]/horses/[horseId]/page.tsx` + `client.tsx`
- Chrome data: `useHorseView(horseId)` — cache hit from layout RSC
- Social lists: `useHorseHubSocial(horseId)` — Hub-only, not layout-seeded
- i18n: `horseHub` namespace

---

## Three-control visibility model

```mermaid
flowchart TB
  req[Requester]
  L1[Layer1_profileVisibility]
  L2[Layer2_hubSections]
  hub[FilteredHubDTO]

  req --> L1
  L1 -->|"deny"| blocked[404]
  L1 -->|"allow"| L2
  L2 --> hub
```

**Unified modes (both layers):** `public` | `relationship` | `owner` (`visibilityEnums`; legacy `owner_only` migrates to `owner`).

**Audiences:**
- **owner** — ownership team: main owner + co-owners + responsibles (`userOwnsEntity`)
- **relationship** — ownership team **plus** accepted horse `Relationship` **plus** active workplace collaborators on related host entity profiles (stable / breeder / transport / riding club)
- **public** — anyone
- Nested inclusion: `owner` ⊆ `relationship` ⊆ `public`

**Layer 1 — global:** `Horse.profileVisibility` — can this viewer open the Hub / public card at all? Deny → **404**.

**Layer 2 — Hub sections:** `Horse.hubSections` — which Hub blocks appear? Every section visibility popover is Layer-2 only.

Tabs are a separate, role-based control (`viewerRole` → `allowedTabs`); Layer 1 only gates whether the horse opens at all (404). Layer 2 (`hubSections[key]`) gates which content blocks appear, independent of viewer role.

```ts
hubSections: {
  identity: { mode },                 // default public — Profile Identity + Hub
  identification: { mode },           // default public — Profile Identification + Hub
  pedigree: { mode },                 // default public — Hub
  about: { mode },                    // default public — Hub
  ownership: { mode },                // default relationship — Admin Ownership + Hub
  value: { mode },                    // default owner — Admin Horse Value + Hub
  proactiveRepresentatives: { mode }, // default owner — Admin + Hub
  coOwnerManagement: { mode },        // default owner — Admin + Hub
  gallery: { mode },                  // default public — Media Gallery + Hub
  planning: { mode },                 // default public — Planning + Hub
  connections: { mode },              // default relationship — Connect Connections + Hub
}
```

Keys match section responsibility (1:1 with Profile/Admin/Media/Planning/Connect sections that have popovers). **Hub-facing cheap keys:** `identity` | `identification` | `pedigree` | `about` | `ownership` | `value` | `proactiveRepresentatives` | `coOwnerManagement` projected on `GET …/horses/:id`; **list keys** on `GET …/hub-social` (`gallery`, `planning`, `connections`). No per-section `entityIds`.

**Read flow:** Layer 1 → Layer 2 → render/return only allowed data. Do **not** ship full horse and hide in React.

**List APIs:** `GET …/media` and `GET …/planning` enforce the same Layer 1 → Layer 2 gates. **Owner team always receives the full management list** (so they can edit content even when Hub mode hides it from others). Non-owners: L2 deny → empty list; else filter by item `visibilityMode` (`entities` maps to `relationship`).

**Autosave:** Profile/Admin/Media Gallery/Planning/Connect Connections compose `HorseSectionVisibility` in the `Section` `visibilityControl` slot. That adapter uses shared `SectionVisibilityControl` → `useUpdateHorseHubSection` → `PATCH …/hub-sections`. Do **not** wire section PATCH in page `client.tsx`. Not part of Profile/Admin form Save and not the discovery route. Admin Layer-1 `profileVisibility` remains on Admin form Save → `PATCH …/discovery`.

Policy: `lib/horses/horseVisibilityAccess.ts` (`assertCanViewHorseGlobal`, `canViewHorseHubSection`, `canAccessByItemVisibilityMode`).

Public card contact still comes from the main owner, filtered by `User.preferences` via `lib/privacy/userVisibility.ts`.

Migrations:
- `scripts/migrate-horse-visibility-owner.mjs` (`owner_only` → `owner`)
- `scripts/migrate-horse-hub-sections-identity.mjs` (`hubSections.overview` → `identity`; ensure `identification`)

---

## Contact resolution rules

1. Public horse cards resolve contact from the main owner only.
2. Owner identity/contact is mapped through `lib/privacy/userVisibility.ts`.
3. Private owner profiles can still operate public horses; contact fields may be omitted based on requester audience.

---

## Web UI

### Horse list (`/horses`)

Role-aware page at `/horses`:

- **Authenticated users** — see their owned/co-owned horses sorted by most recently updated, plus a link to add a new horse
- **Guests** — see public horses with `profileVisibility: "public"`
- Page: `app/[locale]/horses/page.tsx` — `Suspense` + `HorseListPageSkeleton`
- Components: `components/horses/list/horse-list-page.tsx`, `list/horse-card.tsx`, `list/horse-list-page-skeleton.tsx` (if present)
- Hook: `useHorseList({ mine, page, limit })` → `GET /api/v1/horses`
- i18n: `horsesList` namespace (title, description, addHorse, noResults, pagination, filter labels)
- Shared filter: `components/shared/entity-filter.tsx` (reusable filter bar with text, select, flag-select, toggle, and range fields)

Each card links to `/horses/{horseId}` (the role-aware hub page). Filter controls (breed, sex, location) update the URL as the single source of truth.

### Create horse

Authenticated create flow at `/horses/new` (locale-prefixed for `es`). The form follows the same component structure as the profile page (`profile-form.tsx`).

**Form sections (top to bottom):**
1. **Media** — profile photo (`ProfilePhotoField` from `components/shared/`), gallery (`FileUpload` from `components/shared/`), description, notes
2. **Horse identity** — name, registeredName, breed, sex, dateOfBirth, color, heightHands, disciplines (multi-select only; no separate primary), registryId, microchipId, passportNumber, countryOfBirth
3. **Commercial** — estimatedValue, valueCurrency, saleStatus, askingPrice, acquisitionDate. Acquisition source (`acquisitionSourceUserId`) is read-only — auto-set to the creating owner, updated on ownership transfer, and falls back to the current owner for display.
4. **Pedigree** — sireName, damName, bloodlineNotes (sireHorseId/damHorseId set via consent-based connections)
5. **Discovery** — profileVisibility

**Upload flow:** Files (profile photo + gallery) are uploaded first via `POST /api/v1/media/upload` → Cloudinary URLs. The horse is then created via `POST /api/v1/horses` as JSON with those URLs included as `profileImageUrl` and `gallery`.

**Files:**
- Page: `app/[locale]/horses/new/page.tsx` — `Suspense` + skeleton
- Components: `components/horses/create/horse-create-page-content.tsx`, `create/horse-create-form.tsx`, `create/horse-create-page.tsx` (+ skeleton if present)
- Shared components: `components/shared/profile-photo-field.tsx`, `components/shared/file-upload.tsx`
- Validation: `lib/validations/horse.ts`, `lib/validations/horseForms.ts`
- Breed enum: `utils/enums.ts` (`horseBreedEnums` — 51 breeds, used by model validation and form select)
- Form mapping: `lib/utils/horseFormMapping.ts` (maps all fields + media URLs)
- Service: `lib/services/horseService.ts` (persists all fields)
- Upload endpoint: `app/api/v1/media/upload/route.ts` (accepts multipart, uploads to Cloudinary)
- i18n: `messages/en.json` and `messages/es.json` (`createHorse` namespace with field labels, section titles, option enums, photo labels)

On success the UI toasts and redirects to `/horses/{horseId}`. Profile visibility (`profileVisibility`) is optional on create; default is `public`.

### Horse hub (`/horses/[horseId]`)

Read-only social profile page (optional auth). The Hub tab is the public face of a horse. Data flows from the `layout.tsx` RSC (pre-seeded TanStack cache) — no extra network call.

- Page: `app/[locale]/horses/[horseId]/page.tsx` + `client.tsx`
- Components: `components/horses/hub/horse-hub-hero.tsx`, `horse-hub-about.tsx`, `horse-hub-disciplines.tsx`, `horse-hub-value.tsx`, `horse-hub-gallery.tsx`, `horse-hub-pedigree.tsx`, `horse-hub-people.tsx`
- Data: `useHorseView(horseId)` for chrome sections; Hub Media via `useHorseHubGallery` → `GET …/hub-gallery` (paginated, responsive page size)
- i18n: `horseHub` namespace

Layer 1 deny → 404. Guests may view when Layer 1 allows. No visibility popovers on Hub; those live on Profile/Admin/Media/Planning/Connect.

**Hub Media:** `horse-hub-gallery.tsx` — All/Photos/Videos tabs, responsive grid (6/9/12), pagination, view-only lightbox (`HorseMediaLightboxDialog`). Only Hub-visible items (`isVisibleOnHub`) with audience `visibilityMode` after Layer-2 `gallery`.

### Horse profile (`/horses/[horseId]/profile`)

Deferred edit form for identity, identification, pedigree, and about (disciplines multi-select lives in about).

Pedigree sire/dam: **Add** (`SectionTitleAction`) opens one reusable search/invite **`PendingDialog`** (`horse-pedigree-parent-dialog.tsx` + shared `HorseInviteSection`); linked parents render as shared **`EntityChip`** (`entityType="horse"`, horse name + owner email → horse Hub) with clear. Linking uses **PedigreeConnection** acknowledgment (not ownership transfer). See [`pedigreeConnections.md`](./pedigreeConnections.md). Registry / microchip / passport are optional at horse **create**; at least one is required when saving the horse **profile**. When set, each is uniquely indexed.

- Assembly: `app/[locale]/horses/[horseId]/profile/client.tsx` — parent owns one `useForm` + single Save
- Field sections under `components/horses/profile/` (`horse-*-section.tsx`) receive `control` only (no per-section Save)
- Patches: `lib/utils/horseProfilePatch.ts` — dirty-field horse patch
- Hooks: `useUpdateHorse`
- Unsaved navigation: `UnsavedChangesProvider` in `HorsePageShell` + tab intercept in `EntityTabs`
- Pattern: [`page-flow-blueprint.md`](./page-flow-blueprint.md) §6.5

### Horse admin (`/horses/[horseId]/admin`)

Owner-only tab. **Visibility** (`HorseVisibilitySection`) edits `profileVisibility` via `useUpdateHorseVisibility` → `PATCH /api/v1/horses/:id/discovery`. Sale settings use the same deferred-form pattern as Profile; ownership/responsible sections use immediate actions.

- Assembly: `app/[locale]/horses/[horseId]/admin/client.tsx` — parent owns one deferred form (sale + visibility) + single bottom Save; ownership action dialogs mount beside sections
- Components under `components/horses/admin/` (`horse-visibility-section.tsx`, `horse-value-section.tsx`, ownership/responsible sections)
- Sale patches: `lib/utils/horseSalePatch.ts` → `useUpdateHorseSale`
- Action sections (own mutations):
  - **Owner / co-owners / proactive representatives:** `EntityChip` (`entityType="user"`) with joined date; **Add** (`SectionTitleAction`) → `HorseAdminRoleInviteDialog` (`PendingDialog` + `UserInviteSection`); remove via `ConfirmDeleteDialog`
  - **Ownership management:** current owner `EntityChip`; **Change owner** (`SectionTitleAction`) → `HorseOwnershipChangeDialog` (`PendingDialog` then `ConfirmActionDialog` for `transfer_main`)
  - Shared identity card: `components/shared/entity-chip.tsx` + `lib/navigation/entityPaths.ts`
- Same unsaved-changes guard as Profile when sale/visibility fields are dirty
- Pattern: [`page-flow-blueprint.md`](./page-flow-blueprint.md) §6.5

### Horse connect (`/horses/[horseId]/connect`)

Admin-only tab (`requireOwnership`) to invite providers and manage connections.

- Server component: `app/[locale]/horses/[horseId]/connect/page.tsx`
- Client assembly: `app/[locale]/horses/[horseId]/connect/client.tsx` — single Connections section; Invite via `SectionTitleAction` in `titleAddon` → `HorseConnectInviteDialog`; `visibilityControl={<HorseSectionVisibility sectionKey="connections" … />}`
- Invite dialog: `components/horses/connect/horse-connect-invite-dialog.tsx` — `PendingDialog` + `UserInviteSection` (`searchMode="entities"`) → `useCreateRelationshipInvite`
- Connections table: `components/horses/connect/horse-connections-table-section.tsx` — Admin History `DataTable` pattern (`TableUserAvatarCell`, `TableRowAction` for End/Cancel, `columnOrder`, `isRealtimeFilterColumn`, `ConfirmDeleteDialog`); receiver images enriched on list APIs
- Hooks: `useHorseProviders`, `useHorsePendingRelationships`, `useEndRelationship`, `useCancelSentInvite`
- i18n: `horseConnect` namespace

**Visibility:** Layer-2 `hubSections.connections` (default `relationship`) via section popover — also gates the Hub connections block. Connect providers list stays ownership-gated.

### Horse history (`/horses/[horseId]/history`)

Admin-only audit log (`requireOwnership` + `userOwnsEntity` on `GET …/audit`). No Layer-2 section visibility control.

- Server component: `app/[locale]/horses/[horseId]/history/page.tsx`
- Client assembly: `app/[locale]/horses/[horseId]/history/client.tsx`
- Audit section: `components/horses/history/horse-history-audit-section.tsx` — Admin History `DataTable` pattern (`TableUserAvatarCell` + shared initials; read-only, no action column)
- Service DTO fields: `userEmail`, `userUsername`, `userImageUrl`
- Hooks: `hooks/queries/useHorseAudit.ts` — `useHorseAuditLogs` (`queryKeys.horses.audit`)
- Service: `lib/services/horseAuditService.ts` — `listAuditLogs` (enriches actor email/image), `recordAudit` (resolves `sourceType` + `actorLabel` when omitted)
- Model: `models/HorseAuditLog.ts` — includes `sourceType`
- i18n: `horseHistory` namespace

Legacy rows without `sourceType` display as Unknown.

### Horse planning (`/horses/[horseId]/planning`)

Calendar for appointments, competitions, training, and daily activities. Tab stays public for view; Layer-2 popover and event create are admin-only.

- Server component: `app/[locale]/horses/[horseId]/planning/page.tsx`
- Client assembly: `app/[locale]/horses/[horseId]/planning/client.tsx` — `visibilityControl={<HorseSectionVisibility sectionKey="planning" … />}` when `horse.isAdmin`
- Calendar section: `components/horses/planning/horse-planning-calendar-section.tsx` — FullCalendar grid + create dialog (admin date click)
- Event form: `components/horses/planning/horse-planning-event-form.tsx` — RHF + Zod (`lib/validations/horsePlanningForms.ts`)
- Calendar UI: `components/horses/planning/horse-events-calendar.tsx`
- Hooks: `hooks/queries/useHorsePlanning.ts` — `useHorsePlanning`, `useCreatePlanningEvent` (`queryKeys.horses.planning` + optional from/to)
- Service: `lib/services/horsePlanningService.ts` — `listPlanning`, `createPlanningItem` (`userOwnsEntity` gate on create)
- Model: `models/HorseEvent.ts`
- i18n: `horsePlanning` namespace

**Visibility:** Layer-2 `hubSections.planning` (section popover) gates Hub planning and filters `GET …/planning` for non–owner-team viewers. Create requires ownership team. Management tab still uses `HorsePageShell` (auth + owner summary).

### Horse media (`/horses/[horseId]/media`)

Single **Media Gallery Control** section: tile dropzone as the first gallery cell, then thumbnails. Pending files open a blocking **upload review Dialog** (blur + focus trap). Gallery Layer-2 visibility control is admin-only (allowed Popover).

- Server component: `app/[locale]/horses/[horseId]/media/page.tsx`
- Client assembly: `app/[locale]/horses/[horseId]/media/client.tsx` — Gallery `visibilityControl={<HorseSectionVisibility sectionKey="gallery" … />}` when `horse.isAdmin`
- Gallery component: `components/horses/media/horse-media-gallery-section.tsx` — tile dropzone (first grid cell) + upload review **Dialog** + thumbnail grid + lightbox + delete + per-item Eye (`isVisibleOnHub`)
- Hooks: `hooks/queries/useMedia.ts` — `useMedia`, `useUploadMedia`, `useDeleteMedia`, `useToggleMediaVisibility` (`queryKeys.horses.media`)
- Service: `lib/services/horseMediaService.ts` — `listMedia`, `createMedia`, `deleteMedia`, `extractStoragePublicId`
- Model: `models/HorseMedia.ts` — `type` (image/video), `url`, `thumbnailUrl`, `sourceEntityType`, `sourceEntityId`, `visibilityMode`
- Upload: `POST /api/v1/horses/:id/media/upload` (multipart + Cloudinary folder + record creation)
- i18n: `horseMedia` namespace

**Cloudinary folder structure:** `horses/{horseId}/media/{sourceEntityType}/`
**Visibility:** Layer-2 `hubSections.gallery` (section visibility Popover) gates Hub gallery and filters `GET …/media` for non–owner-team viewers. Per-item Eye toggles `isVisibleOnHub` (Hub gallery requires Hub-visible items). Owner-uploaded media defaults to public; entity-uploaded media defaults to owner-only. Hub Media UI uses `GET …/hub-gallery` (paginated). Management tab still uses `HorsePageShell` (auth + owner summary).

### Deletion policy (Media and Documents)

**Direct delete** (hard-delete Cloudinary + MongoDB): main owner, co-owner, or proactive representative (`ownedByUserQuery` / `userOwnsEntity`).

**Deletion requests (non-admins):** Vets, trainers, and other non-admins cannot directly delete. They create a request:

| Asset | Create | Decide | Cancel |
|-------|--------|--------|--------|
| Media | `POST /api/v1/horses/:id/media-deletion-requests` | `PATCH .../media-deletion-requests/:requestId` | `DELETE` (requester) |
| Documents | `POST /api/v1/horses/:id/document-deletion-requests` | `PATCH .../document-deletion-requests/:requestId` | `DELETE` (requester) |

**Decision recipients** (`getDeletionDecisionRecipients`): if the horse has any `responsibles[]`, only those users are notified and may approve/decline; otherwise main owner and co-owners.

**Audit:** `MediaDeletionRequest` / `DocumentDeletionRequest` rows remain (status lifecycle); request records are not hard-deleted.

### Horse documents (`/horses/[horseId]/documents`)

Single **Documents** section with Upload via `SectionTitleAction` in `titleAddon`. Upload form opens **`PendingDialog`** (Spinner while uploading).

- Server component: `app/[locale]/horses/[horseId]/documents/page.tsx`
- Client assembly: `app/[locale]/horses/[horseId]/documents/client.tsx` — Upload via `SectionTitleAction` in `titleAddon` → `HorseDocumentsUploadDialog`
- Table: `components/horses/documents/horse-documents-table-section.tsx` — Admin History `DataTable` pattern (User avatar first, `TableIconAction` download/delete, `columnOrder`, realtime filters)
- Upload dialog: `components/horses/documents/horse-documents-upload-dialog.tsx` — `PendingDialog` + form
- Upload: `POST /api/v1/horses/:id/documents/upload` (multipart + Cloudinary + `Document` record)
- List: `GET /api/v1/horses/:id/documents` — DTO includes `uploadedByName` + `uploadedByImageUrl`
- Delete (admin): `DELETE /api/v1/horses/:id/documents/:docId` — Cloudinary destroy + hard-delete MongoDB
- UI: `ConfirmDeleteDialog` before delete; shared with Media / Admin History
- Service: `lib/services/horseDocumentService.ts`
- Deletion requests: `lib/services/documentDeletionService.ts`
- i18n: `horseDocuments` namespace

**Cloudinary folder:** `equus/horses/{horseId}/documents/`

