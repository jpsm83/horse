# Role/Entity Profiles Refactoring — Design Document

**Date:** 2026-08-02
**Status:** ✅ DONE (executed 2026-08-02 — all phases complete; 818 tests pass, lint clean, tsc clean)
**Scope:** Comprehensive build-out of all 11 entity/role profiles from placeholder "Coming Soon" to full blueprint-aligned pages following horse and user module patterns.

---

## Phase Overview

| Phase | Scope | Entities |
|-------|-------|----------|
| **5A** | Template entity: `stable` — full blueprint | 1 entity |
| **5B** | Entity-owned replication | breeders, transport, riding-clubs (3 entities) |
| **5C** | User-linked replication | trainer, veterinary, groom, farrier, coach, rider (6 entities) |
| **5D** | Special page refactor | workplaces (1 route) |

---

## Architecture Patterns

### Entity variant types

| Type | Owned by | Multi per user | Co-owners | Workplace host | Profile check |
|------|----------|----------------|-----------|----------------|---------------|
| **Entity-owned** | `mainOwnerUserId` + `coOwners[]` | Yes | Yes | Yes | `page-shell.tsx`: `requireOwnership` / `requireMainOwner` |
| **User-linked** | `User.*ProfileId` | No (one per User) | No | No | `page-shell.tsx`: `user.*ProfileId === entityId` |

---

## 1. Phase 5A — Stable (Template Entity)

Stable is entity-owned, the second-most complex entity after horse. It serves as the canonical template.

### 1.1 Directory Structure

```
app/[locale]/stables/
  page.tsx                    ← thin SC: generateMetadata + <StableListClient />
  client.tsx                  ← NEW: list page content
  loading.tsx                 ← NEW: StablePageContentSkeleton

app/[locale]/stables/new/
  page.tsx                    ← thin SC: generateMetadata + <StableCreateClient />
  client.tsx                  ← NEW: useSearchParams wrapper → <StableCreateContent />
  loading.tsx                 ← NEW: StablePageContentSkeleton

app/[locale]/stables/[stableId]/
  layout.tsx                  ← NEW: RSC prefetch + PreferHydrationBoundary (mirrors horse layout)
  page.tsx                    ← thin SC: generateMetadata + <StableHubContent />
  client.tsx                  ← NEW: public hub content assembly
  loading.tsx                 ← NEW: StablePageContentSkeleton

app/[locale]/stables/[stableId]/profile/
  page.tsx                    ← thin SC: generateMetadata + <StableProfileClient />
  client.tsx                  ← NEW: StablePageShell + Section + profile fields
  loading.tsx                 ← NEW: StablePageContentSkeleton

app/[locale]/stables/[stableId]/admin/
  page.tsx                    ← thin SC: generateMetadata + <StableAdminClient />
  client.tsx                  ← NEW: StablePageShell(requireOwnership) + Section + discovery
  loading.tsx                 ← NEW: StablePageContentSkeleton

components/stable/
  stable-page-shell.tsx                ← NEW: auth + ownership gate (mirrors HorsePageShell)
  stable-layout-chrome.tsx             ← NEW: EntityTabs + content wrapper (mirrors HorseLayoutChrome)
  stable-page-content-skeleton.tsx     ← NEW: body skeleton (mirrors HorsePageContentSkeleton)
  hub/
    stable-hub-hero.tsx                ← NEW: public card hero (name, location, description, image)
    stable-hub-about.tsx               ← NEW: description, services, disciplines
    stable-hub-contact.tsx             ← NEW: email, phone, website
  profile/
    stable-identity-section.tsx        ← NEW: tradeName, description, disciplines, services (deferred form)
    stable-contact-section.tsx         ← NEW: email, phoneNumber, website (deferred form)
    stable-address-section.tsx         ← NEW: address fields (deferred form)
  admin/
    stable-visibility-section.tsx      ← NEW: isPublic, acceptsNewHorses toggles → PATCH /api/v1/stables/:id/discovery
    stable-ownership-section.tsx       ← NEW: owner EntityChip + transfer link (reuses OwnershipTransfer)
  shared/
    stable-section-visibility.tsx      ← NEW: Layer-2 section visibility → PATCH /api/v1/stables/:id/hub-sections
  create/
    stable-create-content.tsx          ← NEW: RHF form: tradeName, email, phoneNumber, address, disciplines, services
  list/
    stable-list-content.tsx            ← NEW: owned stables grid/cards + add-stable CTA
```

### 1.2 Stable Tabs

| Tab | Path | Minimum viewerRole | Content |
|-----|------|-------------------|---------|
| hub | `/stables/[id]` | guest | Hero, about, services, contact (public card) |
| profile | `/stables/[id]/profile` | responsible | Identity fields (deferred form: one Save) |
| admin | `/stables/[id]/admin` | main_owner | Visibility, discovery, ownership management |

### 1.3 Key Components

`StablePageShell` mirrors `HorsePageShell`:
- useAppAuth() + useStableView(horseId) from TanStack cache (seeded by layout RSC)
- Auth gate: redirect to sign-in if not authenticated
- Ownership gate: requireOwnership/requireMainOwner checks via stable.isAdmin/isMainOwner
- Loading: StablePageContentSkeleton (suppressHydrationWarning)
- Render props: { stable, isOwner }

`StableLayoutChrome` mirrors `HorseLayoutChrome`:
- EntityTabs + UnsavedChangesProvider
- Content wrapper with padding

`layout.tsx` mirrors horse layout:
- RSC, no "use client"
- getServerUserId → getStableView(horseId, userId)
- PreferHydrationBoundary + dehydrate
- Non-fatal catch

`StableCreateContent`:
- RHF + Zod form (deferred, single Save)
- Fields: tradeName, description, email, phoneNumber, website, disciplines[], services[], address
- Calls POST /api/v1/stables → redirects to new stable hub

### 1.4 i18n — New keys for stables

```
stable:
  hub:
    title, loadFailed
  profile:
    title, identitySection, contactSection, addressSection, save, saving, loadFailed
  admin:
    title, visibilitySection, isPublic, acceptsNewHorses, discoverySection, loadFailed
  create:
    title, description, tradeName, email, phoneNumber, website, disciplines, services, address, submit, submitting, failed
  list:
    title, empty, addStable, loadFailed
metadata:
  stableHub, stableProfile, stableAdmin, stableCreate, stables
common:
  backToStables
```

---

## 2. Phase 5B — Entity-Owned Replication

These 3 share the same architecture as stable (entity-owned, `mainOwnerUserId` + `coOwners[]`):

### 2.1 Breeder (`/breeders`)

Same structure as stable with entity-specific fields:

```
components/breeder/
  breeder-page-shell.tsx, breeder-layout-chrome.tsx, breeder-page-content-skeleton.tsx
  hub/breeder-hub-hero.tsx, hub/breeder-hub-about.tsx, hub/breeder-hub-contact.tsx
  profile/breeder-identity-section.tsx, breeder-contact-section.tsx, breeder-address-section.tsx
  admin/breeder-visibility-section.tsx, breeder-ownership-section.tsx
  shared/breeder-section-visibility.tsx
  create/breeder-create-content.tsx           ← operationName, email, phoneNumber, breeds, website
  list/breeder-list-content.tsx

app/[locale]/breeders/
  page.tsx, client.tsx, loading.tsx
  new/page.tsx, new/client.tsx, new/loading.tsx
  [breederId]/layout.tsx, page.tsx, client.tsx, loading.tsx
  [breederId]/profile/page.tsx, client.tsx, loading.tsx
  [breederId]/admin/page.tsx, client.tsx, loading.tsx
```

**API already exists:** `POST /api/v1/breeders`, `GET /api/v1/breeders/:id`, `PATCH /api/v1/breeders/:id/discovery`

### 2.2 Transport (`/transport`)

```
components/transport/
  transport-page-shell.tsx, transport-layout-chrome.tsx, transport-page-content-skeleton.tsx
  hub/transport-hub-hero.tsx, transport-hub-about.tsx, transport-hub-contact.tsx
  profile/transport-identity-section.tsx, transport-contact-section.tsx, transport-address-section.tsx
  admin/transport-visibility-section.tsx, transport-ownership-section.tsx
  shared/transport-section-visibility.tsx
  create/transport-create-content.tsx         ← companyName, email, phoneNumber, emergencyPhone, specialties, serviceAreas
  list/transport-list-content.tsx

app/[locale]/transport/
  page.tsx, client.tsx, loading.tsx
  new/page.tsx, new/client.tsx, new/loading.tsx
  [transportId]/layout.tsx, page.tsx, client.tsx, loading.tsx
  [transportId]/profile/page.tsx, client.tsx, loading.tsx
  [transportId]/admin/page.tsx, client.tsx, loading.tsx
```

**API already exists:** `POST /api/v1/transports`, `GET /api/v1/transports/:id`, `PATCH /api/v1/transports/:id/discovery`

### 2.3 Riding Club (`/riding-clubs`)

```
components/riding-club/
  riding-club-page-shell.tsx, riding-club-layout-chrome.tsx, riding-club-page-content-skeleton.tsx
  hub/riding-club-hub-hero.tsx, riding-club-hub-about.tsx, riding-club-hub-contact.tsx
  profile/riding-club-identity-section.tsx, riding-club-contact-section.tsx, riding-club-address-section.tsx
  admin/riding-club-visibility-section.tsx, riding-club-ownership-section.tsx
  shared/riding-club-section-visibility.tsx
  create/riding-club-create-content.tsx       ← clubName, email, phoneNumber, disciplines, facilities, membershipInfo, membershipFee
  list/riding-club-list-content.tsx

app/[locale]/riding-clubs/
  page.tsx, client.tsx, loading.tsx
  new/page.tsx, new/client.tsx, new/loading.tsx
  [clubId]/layout.tsx, page.tsx, client.tsx, loading.tsx
  [clubId]/profile/page.tsx, client.tsx, loading.tsx
  [clubId]/admin/page.tsx, client.tsx, loading.tsx
```

**API already exists:** `POST /api/v1/riding-clubs`, `GET /api/v1/riding-clubs/:id`, `PATCH /api/v1/riding-clubs/:id/discovery`

---

## 3. Phase 5C — User-Linked Replication

These 6 are user-linked (one per User, no `coOwners[]`, no WorkplaceRelationship as host):

### 3.1 User-Linked PageShell Pattern

Differs from entity-owned in the ownership check:

```tsx
// TrainerPageShell — user-linked variant
export function TrainerPageShell({ trainerId, children }) {
  const { user, isAuthenticated, isLoading } = useAppAuth();
  const { data: trainer, isLoading: isViewLoading } = useTrainerView(trainerId);

  // User-linked check: is the trainerId the user's own trainerProfileId?
  const isOwner = user?.trainerProfileId === trainerId;
  // ...
}
```

User-linked entities have only 2 tabs (no admin tab for co-owners):

| Tab | Path | Access | Content |
|-----|------|--------|---------|
| hub | `/[entity]/[id]` | guest | Public card |
| profile | `/[entity]/[id]/profile` | owner | Edit fields (deferred form) + visibility |

The visibility/discovery settings (`isPublic`, `acceptsNewClients`) go in the profile tab's deferred form for user-linked entities (no separate admin tab).

### 3.2 Trainer (`/trainers`)

```
components/trainer/
  trainer-page-shell.tsx, trainer-layout-chrome.tsx, trainer-page-content-skeleton.tsx
  hub/trainer-hub-hero.tsx, trainer-hub-about.tsx, trainer-hub-contact.tsx
  profile/trainer-identity-section.tsx, trainer-contact-section.tsx, trainer-visibility-section.tsx
  shared/trainer-section-visibility.tsx
  create/trainer-create-content.tsx            ← displayName, email, phoneNumber, bio, specialties, experienceYears
  list/trainer-list-content.tsx

app/[locale]/trainers/
  page.tsx, client.tsx, loading.tsx
  new/page.tsx, new/client.tsx, new/loading.tsx
  [trainerId]/layout.tsx, page.tsx, client.tsx, loading.tsx
  [trainerId]/profile/page.tsx, client.tsx, loading.tsx
```

**API already exists:** `POST /api/v1/trainers`, `GET /api/v1/trainers/:id`, `PATCH /api/v1/trainers/:id/discovery`

### 3.3 Veterinary (`/veterinaries`)

Same structure as trainer with entity fields:
- Create: practiceName, email, phoneNumber, emergencyPhoneNumber, description, equineSpecializations, emergencyAvailability, serviceAreaKm
- Profile: identity, contact, visibility (isPublic, acceptsNewPatients)

### 3.4 Groom (`/groomers`)

Same structure as trainer with entity fields:
- Create: displayName, email, phoneNumber, bio, specialties, experienceYears
- Profile: identity, contact, visibility (isPublic, acceptsNewClients)

### 3.5 Farrier (`/farriers`)

Same structure as trainer with entity fields:
- Create: displayName, email, phoneNumber, bio, experienceYears, serviceAreaKm
- Profile: identity, contact, visibility (isPublic, acceptsNewClients)

### 3.6 Coach (`/coaches`)

Same structure as trainer with entity fields:
- Create: displayName, email, phoneNumber, bio, disciplines, competitionLevels, preparationServices, experienceYears
- Profile: identity, contact, visibility (isPublic, acceptsNewClients)

### 3.7 Rider (`/riders`)

Same structure as trainer with entity fields:
- Create: displayName, email, phoneNumber, bio, disciplines, experienceYears, competitionHighlights
- Profile: identity, contact, visibility (isPublic, acceptsNewClients)

---

## 4. Phase 5D — Special Page (Workplaces)

### 4.1 Workplaces (`/workplaces`)

```
app/[locale]/workplaces/
  page.tsx          ← remove Suspense, import from ./client.tsx
  client.tsx        ← NEW: useSearchParams wrapper → <WorkplacesContent membership={...} />
  loading.tsx       ← updated: replace bare Skeleton with WorkplacePageContentSkeleton
```

`WorkplacesContent` receives `membership` param from `client.tsx`. Add file header to `WorkplacesContent`. Wrap invitations + list sections in `Section` + `SectionErrorBoundary`.

> **Note:** `/pedigree-connections` is an inbox page (same accept/decline pattern as relationships/ownership-transfers). It is **handled in Area 6 Phase 6A** (`2026-08-02-cross-cutting-modules-refactor-design.md`), not here, to avoid duplicate work.

---

## 5. Shared Patterns

### 5.1 Skeleton Component (every entity)

```tsx
// components/stable/stable-page-content-skeleton.tsx
export function StablePageContentSkeleton({
  suppressHydrationWarning,
  showSpinner = true,
}: {
  suppressHydrationWarning?: boolean;
  showSpinner?: boolean;
}) {
  return (
    <div className="relative w-full h-full" suppressHydrationWarning={suppressHydrationWarning}>
      {showSpinner && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <Spinner className="size-6" />
        </div>
      )}
      <Skeleton className="inset-0 h-full w-full p-4 rounded-md" />
    </div>
  );
}
```

Every entity gets its own skeleton component following this exact pattern.

### 5.2 Section Visibility (every entity that supports Layer-2)

```
components/<entity>/shared/<entity>-section-visibility.tsx
  → PATCH /api/v1/<entity>/:id/hub-sections
  → Reuses SectionVisibilityControl + SectionVisibilityPopover (shared)
```

### 5.3 File Headers (every new file)

Per AGENTS.md §11. Format follows `horse-page-shell.tsx`.

### 5.4 Loading States

Every route segment has:
- `loading.tsx` using `*PageContentSkeleton` (same component as inline loading)
- `suppressHydrationWarning` on content containers where SSR skeleton → client data mismatch

### 5.5 Error Boundaries

All data sections wrapped in `SectionErrorBoundary` at the `client.tsx` level. Section header survives child crashes.

---

## 6. i18n Summary

Approximately 165 new keys (11 entities × ~15 keys each). All in `messages/en.json` and `messages/es.json` under entity-specific namespaces.

Example namespace pattern: `stable.hub.title`, `stable.create.tradeName`, `stable.admin.visibilitySection`, etc.

---

## 7. Testing

| Phase | Tests |
|-------|-------|
| 5A | `tests/components/stable/` — skeleton, shell, hub, profile, admin, create, list |
| 5B | `tests/components/breeder/`, `tests/components/transport/`, `tests/components/riding-club/` — per entity |
| 5C | `tests/components/trainer/`, `tests/components/veterinary/`, `tests/components/groom/`, `tests/components/farrier/`, `tests/components/coach/`, `tests/components/rider/` — per entity |
| 5D | `tests/components/workplaces/` |

Each covers: skeleton render, shell auth/ownership gating, hub components, create form submit, profile save.

---

## 8. Cleanup — Delete Placeholder Components

| File | Phase | Reason |
|------|-------|--------|
| `components/layout/entity-page-content.tsx` | 5D | Replaced by all real entity pages |
| `components/layout/discover-placeholder-page.tsx` | 5D | Replaced by entity list pages |
| `components/layout/my-placeholder-page.tsx` | 5D | Replaced by entity create pages |
| `app/[locale]/stables/page.tsx` (old) | 5A | Rewritten |
| `app/[locale]/breeders/page.tsx` (old) | 5B | Rewritten |
| All other entity `page.tsx` that used `EntityPageContent` | 5B/5C | Rewritten |

---

## 9. Complete Checklist

### Phase 5A — Stable
1. Create `components/stable/stable-page-content-skeleton.tsx`
2. Create `components/stable/stable-page-shell.tsx`
3. Create `components/stable/stable-layout-chrome.tsx`
4. Create `components/stable/shared/stable-section-visibility.tsx`
5. Create `components/stable/hub/stable-hub-hero.tsx`, `stable-hub-about.tsx`, `stable-hub-contact.tsx`
6. Create `components/stable/profile/stable-identity-section.tsx`, `stable-contact-section.tsx`, `stable-address-section.tsx`
7. Create `components/stable/admin/stable-visibility-section.tsx`, `stable-ownership-section.tsx`
8. Create `components/stable/create/stable-create-content.tsx`
9. Create `components/stable/list/stable-list-content.tsx`
10. Create `app/[locale]/stables/client.tsx`, `app/[locale]/stables/loading.tsx`
11. Rewrite `app/[locale]/stables/page.tsx` — import from `./client.tsx`
12. Create `app/[locale]/stables/new/client.tsx`, `app/[locale]/stables/new/loading.tsx`
13. Rewrite `app/[locale]/stables/new/page.tsx` — remove Suspense, import from `./client.tsx`
14. Create `app/[locale]/stables/[stableId]/layout.tsx`
15. Create `app/[locale]/stables/[stableId]/client.tsx`, `loading.tsx`
16. Rewrite `app/[locale]/stables/[stableId]/page.tsx` — import from `./client.tsx`
17. Create `app/[locale]/stables/[stableId]/profile/page.tsx`, `client.tsx`, `loading.tsx`
18. Create `app/[locale]/stables/[stableId]/admin/page.tsx`, `client.tsx`, `loading.tsx`
19. Add stable i18n keys to `en.json`, `es.json`
20. Create `tests/components/stable/` tests
21. Run `npm test` + `npm run lint`

### Phase 5B — Breeder
22-42. Repeat steps 1-21 for breeder

### Phase 5B — Transport
43-63. Repeat steps 1-21 for transport

### Phase 5B — Riding Club
64-84. Repeat steps 1-21 for riding-club

### Phase 5C — Trainer
85-105. Repeat steps 1-21 for trainer (user-linked variant)

### Phase 5C — Veterinary
106-126. Repeat steps 1-21 for veterinary (user-linked variant)

### Phase 5C — Groom
127-147. Repeat steps 1-21 for groom (user-linked variant)

### Phase 5C — Farrier
148-168. Repeat steps 1-21 for farrier (user-linked variant)

### Phase 5C — Coach
169-189. Repeat steps 1-21 for coach (user-linked variant)

### Phase 5C — Rider
190-210. Repeat steps 1-21 for rider (user-linked variant)

### Phase 5D — Workplaces
211. Create `app/[locale]/workplaces/client.tsx` — useSearchParams wrapper
212. Create `WorkplacePageContentSkeleton.tsx`
213. Update `app/[locale]/workplaces/loading.tsx` — use named skeleton
214. Rewrite `app/[locale]/workplaces/page.tsx` — remove Suspense, import from `./client.tsx`
215. Add `Section` + `SectionErrorBoundary` wrapping in WorkplacesContent
216. Add file header to WorkplacesContent

### Cleanup
217. ✅ Delete `components/layout/entity-page-content.tsx`
218. ✅ Delete `components/layout/discover-placeholder-page.tsx`
219. ✅ Delete `components/layout/my-placeholder-page.tsx`

### Final Verification
220. ✅ Run `npm test` — all pass (818/818)
221. ✅ Run `npm run lint` — no errors (0 errors)
222. ⏳ Verify each entity end-to-end: list → create → hub → profile → admin (manual QA)

---

## 10. Completeness Gate

✅ **COMPLETE (2026-08-02):** All 5 phases done. `npm test` (818/818), `npm run lint` (0 errors), `tsc --noEmit` (clean). Manual QA of each entity's flows pending user verification.

Every one of the 11 entity types now has:
- [x] Real list page with data (not "Coming Soon")
- [x] Real create form with entity-specific fields
- [x] Detail hub with public card displaying entity data
- [x] Profile tab for owner editing (deferred form: one Save)
- [x] Admin tab for discovery/visibility settings (entity-owned) or visibility in profile (user-linked)
- [x] `loading.tsx` + named `*PageContentSkeleton` on every route segment
- [x] `client.tsx` co-located with every page (never inline Suspense or direct import)
- [x] `Section` + `SectionErrorBoundary` wrapping all data sections
- [x] `layout.tsx` with RSC prefetch + PreferHydrationBoundary for entity detail routes
- [x] `*PageShell` + `*LayoutChrome` for entity detail pages
- [x] `*SectionVisibility` shared component per entity
- [x] File headers on all components per AGENTS.md §11
- [x] i18n keys for all UI strings in `en.json` and `es.json`
- [x] Render tests for all entity components
- [x] Zero placeholder/dead code components
