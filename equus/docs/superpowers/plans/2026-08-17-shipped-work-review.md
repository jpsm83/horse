# Equus shipped-work review tracker

> **For agentic workers:** Execute **one block at a time**, in order. Do not start the next block until the current one is marked **done** or **parked**. Follow the **align vs greenfield** rule below. Do not start capabilities that have no code yet (chat, favorites, waiting-transfer, stable ops, Portuguese).

**Goal:** Walk every Equus surface that already exists against the canonical docs. Where the docs were re-thought after the code was written, **change the source** until it matches — including deleting, updating, and creating files, routes, UI, and database models. Leave a written verdict before starting truly new product capabilities.

**Architecture:** Product/features own *what* and *why*. Engineering owns *what exists* (`aligned` / `drift`). Conventions own *how to write*. On **drift**, read **Shipped** (what the code does today — do not extend dead behavior) then **Target** (what the docs now require). If that capability already exists in the app, **implement Target**. If it does not exist at all, leave it parked.

**Tech stack:** Next.js 16 App Router, React 19, TypeScript, REST `/api/v1`, `lib/services`, MongoDB/Mongoose, TanStack Query, next-intl, shadcn/ui.

## Align vs greenfield (mandatory)

Docs moved. Some code did not. This review exists to close that gap — not to freeze old Shipped behavior, and not to invent whole new products.

| Kind | Test | What to do |
|------|------|------------|
| **Align existing** | The capability already has source (API, UI, models, billing, tabs, home, invite picker, …) and the **docs now describe a different contract** | Update the source to match **Target** / current product. Delete dead paths. Change models. Create new files if the new contract needs them. Example: monetization still exists; it is no longer owner-pays horse tiers — replace it with entity subscription. |
| **Greenfield (parked)** | There is **no** real implementation — only a spec, a stub comment, or an unused field | Do **not** build it here. Example: WhatsApp-style chat, favorites, waiting-transfer + daily nag, stable roster/whiteboard/finance, Portuguese locale. |

**Align existing includes create.** New Stripe entity objects, a Stable billing section, or an email-only invite path are in scope when they replace a feature that already shipped under the old rules.

**Greenfield stays out even if the spec is marked Target.** `POST /api/v1/chat` is Target and still parked. A full stable ops module is Target and still parked.

When Target for an **existing** feature depends on a **greenfield** piece, implement everything that can stand on current code and record the leftover as a dependency — do not use that leftover as an excuse to skip the rest. Example: `/home` becomes an action inbox from existing relationship / workplace / ownership-transfer APIs; waiting-transfer rows wait until that flag exists.

## Global constraints

- App code lives in `equus/`. Start every session at repo-root `AGENTS.md`.
- Open **only** the docs listed on the block. Do not load `equus/docs/` wholesale.
- UI must call `/api/v1`. Only `app/api/**/route.ts` may import services/models at runtime (`import type` is fine).
- **Entity must be Equus user** to act in-app. **Horses can work with anyone** (Hub only until an in-app entity connection exists).
- **Do not reintroduce:** owner-pays horse tiers · people search as a module · Veterinary in the launch gate · last-used-module as home · follow/likes/public feed.
- After a block: unit tests + the **real user flow**. Commands from `equus/`: `npm test`, `npm run lint`.
- **Test colocation (every block):** per [`equus/docs/conventions/testing.md`](../conventions/testing.md), move this block’s tests from the legacy mirror `equus/tests/…` into `__tests__/` next to the source they cover; then update, delete, or create tests only in the colocated folder. Do not leave duplicate mirror + `__tests__` for the same module. Keep `equus/tests/` for shared harness only (`setup.ts`, `helpers/`, cross-cutting architecture guards).
- **Senior engineer (every block):** apply [`agents/senior-engineer.md`](../../../agents/senior-engineer.md) to every file in the block’s code roots — not only doc alignment. That includes: root-cause fixes only; post-task cleanup; file headers on touched modules; **no `useRef` for DOM manipulation**; **no imperative DOM** (`document.*`, `window.*` listeners, manual class toggling, `ref.current.click()`, anchor injection) unless there is genuinely no declarative React alternative — and any exception must be **justified in code** (brief comment) and noted in the block’s **Senior engineer** findings.
- Update this file when a block finishes (status, date, findings). If product/engineering status changes because the code now matches Target, mark that engineering doc **aligned** (or update Shipped).

---

## How to execute a block

1. Copy the prompt at the bottom of this file (or say: “execute block N”).
2. Open only the listed docs (+ [`equus/docs/conventions/testing.md`](../conventions/testing.md) for test placement).
3. **Migrate tests:** find every file under `equus/tests/` that covers this block’s code roots; move each into the matching `__tests__/` folder beside its source; delete the mirror copy.
4. Review API → services → models → UI → hooks → tests against those docs **and** [`agents/senior-engineer.md`](../../../agents/senior-engineer.md) (React-first: no DOM `useRef`; no unjustified `document.*` / `window.*` manipulation — use state, props, composition, server props, `useSyncExternalStore` + `matchMedia`, centralized helpers with comments when unavoidable).
5. Fix root-cause mismatches. If this capability already exists and docs changed, implement the current contract (delete / update / create). If it has no code, do not start it.
6. Run the listed tests and the real user flow.
7. Fill in **Verdict**, **Findings** (include **Senior engineer** subsection), **Test migration**, **Done when**, and the progress table.
8. Stop. Wait for the next block.

### Test migration (every block)

| Legacy mirror | Colocated target |
|---------------|------------------|
| `tests/lib/services/fooService.test.ts` | `lib/services/__tests__/fooService.test.ts` |
| `tests/app/api/v1/.../route.*.test.ts` | `app/api/v1/.../__tests__/route.*.test.ts` |
| `tests/components/.../bar.test.ts` | `components/.../__tests__/bar.test.ts` |
| `tests/hooks/.../useX.test.ts` | `hooks/.../__tests__/useX.test.ts` |

**Stay in `equus/tests/`:** `setup.ts`, `helpers/`, and cross-cutting guards (e.g. `tests/architecture/ui-rest-boundary.test.ts`) that scan the whole tree.

**Block done when:** no mirror tests remain for modules this block owns, `npm test` passes, and block code roots comply with [`agents/senior-engineer.md`](../../../agents/senior-engineer.md) (no unjustified `useRef` or imperative DOM).

### Senior engineer (every block)

Apply [`agents/senior-engineer.md`](../../../agents/senior-engineer.md) in full — not only the items below.

- [ ] Root-cause fixes only; no symptom band-aids
- [ ] No `useRef` for DOM manipulation; no non-DOM `useRef` when `useState`/composition works
- [ ] No unjustified `document.*` / `window.*` / manual DOM writes — prefer declarative React, server-passed props, `useSyncExternalStore`, native HTML
- [ ] Any unavoidable imperative browser API (cookies, `beforeunload`, theme class on `<html>`) lives in a **named helper** with a **why** comment; listed in block findings
- [ ] Touched modules: dead code removed; file headers updated where substantially changed
- [ ] Real user flow verified after code changes

### Status values

| Status | Meaning |
|--------|---------|
| `pending` | Not started |
| `in_progress` | Currently reviewing / polishing |
| `done` | Shipped code matches docs (or documented remaining drift is accepted) |
| `parked` | Whole block is greenfield — nothing to align yet |

### Verdict values

| Verdict | Meaning |
|---------|---------|
| `aligned` | Code already matched current docs |
| `polished` | Code was updated (delete / update / create) so it matches current docs |
| `partial` | Existing capability aligned as far as current code allows; leftover depends on a **greenfield** item (name it in Findings) |
| `blocked` | Cannot finish without a product decision (write the question in Findings) |

Do **not** use a leftover greenfield dependency to skip aligning the rest of an existing feature.

---

## Progress

| # | Block | Eng. status | Review | Verdict | Date |
|---|--------|-------------|---------|---------|------|
| 1 | Architecture and REST boundary | aligned | done | polished | 2026-08-17 |
| 2 | Cross-cutting UI conventions | aligned | done | polished | 2026-08-17 |
| 3 | Models and data lifecycle | aligned | done | aligned | 2026-08-17 |
| 4 | Authentication | aligned | done | polished | 2026-08-17 |
| 5 | User profile and preferences | aligned | done | aligned | 2026-08-17 |
| 6 | i18n | drift (`pt` missing) | done | aligned | 2026-08-17 |
| 7 | Guest landing | aligned | done | aligned | 2026-08-17 |
| 8 | Horse core (REST, visibility, tabs, list/create) | drift | done | polished | 2026-08-17 |
| 9 | Horse Hub | aligned (tabs) | done | polished | 2026-08-17 |
| 10 | Horse Profile and pedigree UI | aligned | done | aligned | 2026-08-17 |
| 11 | Horse Connect, relationships, reviews | aligned | done | polished | 2026-08-17 |
| 12 | Horse Media | aligned | done | polished | 2026-08-17 |
| 13 | Horse Documents | drift (ops writes) | done | polished | 2026-08-17 |
| 14 | Horse Planning | drift (entity aggregation not built) | done | polished | 2026-08-17 |
| 15 | Horse Admin and History | aligned (tabs) | done | polished | 2026-08-17 |
| 16 | Ownership transfer | aligned | done | polished | 2026-08-17 |
| 17 | Pedigree connections API and inbox | aligned | done | polished | 2026-08-17 |
| 18 | Workplace | aligned | done | polished | 2026-08-17 |
| 19 | Notifications | aligned | done | polished | 2026-08-17 |
| 20 | Home / My Graph | aligned (waiting-transfer partial) | done | polished | 2026-08-17 |
| 21 | User hub, public view, people-search | aligned | done | polished | 2026-08-17 |
| 22 | User account tabs | aligned | done | polished | 2026-08-17 |
| 23 | Stable (shipped profile only) | aligned | done | polished | 2026-08-17 |
| 24 | Later modules — entity-owned | aligned | done | aligned | 2026-08-17 |
| 25 | Later modules — user-linked | aligned | done | aligned | 2026-08-17 |
| 26 | Billing → entity subscription | aligned | done | polished | 2026-08-17 |
| 27 | Theme tokens | aligned | done | aligned | 2026-08-17 |
| 28 | Greenfield inventory (not built) | not built | done | aligned | 2026-08-17 |

### Senior engineer retro pass (blocks 1–10, 2026-08-17)

Plan updated to require [`agents/senior-engineer.md`](../../../agents/senior-engineer.md) on every block (`.cursor/rules/senior-engineer.mdc` is a pointer to that file only). Retro-audit covered **all strict rules** — especially React-first (no unjustified `useRef`, `document.*`, or `window.*` manipulation).

**Fixed (removed or replaced imperative patterns):**

| File | Block | Change |
|------|-------|--------|
| `components/shared/unsaved-changes-context.tsx` | 2 | `useRef` → `useState` for pending nav + discard handler |
| `components/table/use-table.ts` + `data-table.tsx` | 2 | drag sort suppression → `suppressHeaderClick` state |
| `components/providers/app-auth-provider.tsx` | 4 | session guards → `hasEverResolvedUser` + effect cleanup |
| `components/horses/create/horse-create-form.tsx` | 8 | `AbortController` scoped to submit handler only |
| `components/horses/hub/horse-hub-gallery.tsx` | 9 | `window.resize` listener → `useHubGalleryPageSize` (`matchMedia` + `useSyncExternalStore`) |
| `hooks/use-hub-gallery-page-size.ts` | 9 | New hook: `useSyncExternalStore` + `matchMedia` (jsdom-safe fallback to 12) |
| `components/horses/hub/horse-hub-share-menu.tsx` | 9 | `window.location.href` → `shareUrl` prop from server `page.tsx` |

**Justified imperative DOM (documented in source; no declarative alternative in App Router today):**

| File | Block | Why |
|------|-------|-----|
| `components/shared/unsaved-changes-context.tsx` | 2 | `beforeunload` — browser API for unsaved navigation warning |
| `components/set-html-lang.tsx` | 6 | `<html lang>` owned by root layout, not React tree |
| `lib/theme/appTheme.ts` | 4/5/22 | Live theme preview + cookie sync on `<html>` class |
| `i18n/syncLocaleCookie.ts` | 6 | Client locale cookie after preferences Save / login |
| `components/providers/app-theme-sync.tsx` | 4 | Applies user theme from REST session |
| `hooks/use-mobile.ts` | 1/2 | `useSyncExternalStore` + `matchMedia` (React external-store pattern) |
| `hooks/use-hub-gallery-page-size.ts` | 9 | Same pattern as `use-mobile`; guards missing `matchMedia` in jsdom |

**Block 2 shared UI — justified (in code roots; shadcn / download helpers):**

| File | Block | Why |
|------|-------|-----|
| `components/ui/sidebar.tsx` | 2 | Cookie persistence for sidebar state + `Ctrl+B` shortcut — no declarative cookie API |
| `components/table/utils.ts` | 2 | Excel blob download via temporary `<a>` — browser file-save pattern |

**Out of blocks 1–10 code roots (later blocks):** `lib/navigation/externalRedirect.ts` (`window.location.assign`) — Block 4 auth redirects; review if a Next.js `redirect()` path exists.

**`equus/` app code: zero `useRef`.** Blocks **1, 3, 5, 6, 7, 10** production roots: no further imperative DOM beyond the justified helpers above.

**Align in this review (existing + docs changed):** owner-tier billing → entity subscription · `/home` roster → action inbox (using existing invite APIs) · people-search invite path → email / entity-linked identity · horse-create paywall off · stop `Horse.subscription.payerUserId` · User Subscription tab off the account.

**Greenfield — do not create here:** chat · favorites · waiting-transfer + daily nag · stable roster / whiteboard / health / feed / finance / owner portal · Portuguese locale · Medical/Feed horse tabs.

---

## Why this order

Foundations first (layers, chrome, models, auth), then the largest existing product (horse + graph), then other entities, then **replace** dead monetization with entity billing (needs Stable to exist), then confirm what is still genuinely unbuilt.

---

## Phase A — Platform

### Block 1: Architecture and REST boundary

**Review:** done  
**Verdict:** polished  
**Date:** 2026-08-17

**Docs (only these):**
- `equus/docs/conventions/architecture.md`
- `equus/docs/conventions/testing.md`
- `equus/docs/engineering/stack.md`
- `equus/docs/conventions/nextjs-conventions.md`

**Also open if a gap is found:** `equus/docs/superpowers/specs/2026-08-13-rest-boundary-gaps-design.md`

**Code roots:** `equus/app/api/v1/`, `equus/app/[locale]/`, `equus/lib/`, `equus/hooks/`, `equus/components/`

**Test migration (this block):**

| From (mirror) | To (`__tests__/`) | Status |
|---------------|---------------------|--------|
| `tests/lib/services/mediaService.test.ts` | `lib/services/__tests__/mediaService.test.ts` | done |
| `tests/app/api/v1/auth/me/route.get.test.ts` | `app/api/v1/auth/me/__tests__/route.get.test.ts` | done |
| `tests/app/api/v1/users/[id]/route.get.test.ts` | `app/api/v1/users/[id]/__tests__/route.get.test.ts` | done |
| `tests/app/api/v1/users/[id]/view/route.get.test.ts` | `app/api/v1/users/[id]/view/__tests__/route.get.test.ts` | done |
| `tests/app/api/v1/users/me/route.delete.test.ts` | `app/api/v1/users/me/__tests__/route.delete.test.ts` | done |
| `tests/app/api/v1/notifications/route.test.ts` | `app/api/v1/notifications/__tests__/route.test.ts` | done |
| `tests/app/api/v1/horses/search/route.test.ts` | `app/api/v1/horses/search/__tests__/route.test.ts` | done |
| `tests/app/api/v1/horses/[id]/ownership-transfers/route.get.test.ts` | `app/api/v1/horses/[id]/ownership-transfers/__tests__/route.get.test.ts` | done |
| `tests/app/api/v1/ownership-transfers/route.test.ts` | `app/api/v1/ownership-transfers/__tests__/route.test.ts` | done |
| horse GET view route test | `app/api/v1/horses/[id]/__tests__/route.get.test.ts` | done (created) |
| media visibility PATCH route test | `app/api/v1/horses/[id]/media/[mediaId]/visibility/__tests__/route.patch.test.ts` | done (created) |
| `tests/architecture/ui-rest-boundary.test.ts` | **keep** in `tests/architecture/` (cross-cutting harness) | n/a |

Entity GET route tests for stables/breeders/… were already colocated. `lib/seo/__tests__/fetchApiJson.test.ts` already colocated. No mirror copies remain under `tests/` for Block 1 modules.

**Check:**
- [x] Route handlers are thin: parse → service → `ok` / `fail`
- [x] Pages, layouts, components, hooks do not runtime-import `@/lib/services/*` or `@/models/*`
- [x] No Server Actions as a product write path
- [x] Entity `GET /:id` returns `{ viewerRole, allowedTabs, <entity> }` (all 11 entity types including horse)
- [x] Web session truth is REST (`useAppAuth` / `/api/v1/auth/me`), not NextAuth `useSession()` alone
- [x] All Block 1 mirror tests migrated; no duplicates left under `tests/` for these modules

**Out of scope:** Rewriting every PATCH/list/search business logic in this block; adding a mobile client. Other blocks own their own Target alignment. Component/hook/page mirror tests move in Blocks 2+ when those surfaces are reviewed.

**Tests:** `npm test -- tests/architecture lib/services/__tests__/mediaService.test.ts app/api/v1` (74 passed). `npm run lint` (0 errors).  
**Real flow:** Verified hooks call `/api/v1` via `fetchWithAuth`; `generateMetadata` uses `fetchApiJson`; `AppAuthProvider` REST session truth.

**Findings:**

- **UI boundary clean:** No runtime `@/lib/services/*` or `@/models/*` imports in `app/[locale]/`, `components/`, or `hooks/` (type-only imports OK). ESLint `no-restricted-imports` guard in place.
- **No Server Actions** in the codebase.
- **Entity GET view contract:** All 11 entity types (10 converted + horse) have colocated `__tests__/route.get.test.ts` asserting `{ viewerRole, allowedTabs, <entity> }`.
- **Dead `getPublicXCard` wrappers:** Already removed from services.
- **Auth:** `useSession()` in `AppAuthProvider` is Google-bridge transport only; `isAuthenticated` = REST user non-null.
- **Fixed — media visibility route:** `PATCH …/media/:mediaId/visibility` delegates to `mediaService.updateMediaHubVisibility` with ownership gate; colocated route test added.
- **Test layout:** Nine mirror files moved to `__tests__/`; two new colocated route tests created; `tests/architecture/ui-rest-boundary.test.ts` stays as cross-cutting harness per convention.
- **Documented drift (later blocks):** `GET /api/v1/horses/search` and `GET /api/v1/search/entities` still contain inline model queries in route handlers. Out of scope; Block 21 owns people-search alignment.
- **Senior engineer (retro):** Broad code roots audited; zero `useRef` in production app code; `use-mobile` uses external-store pattern; UI ref/DOM fixes tracked under Blocks 2/4/8/9.

**Done when:** Boundary checks pass; Block 1 mirror tests migrated; `npm test` green. ✅

---

### Block 2: Cross-cutting UI conventions

**Review:** done  
**Verdict:** polished  
**Date:** 2026-08-17

**Docs (only these):**
- `equus/docs/engineering/page-flow-blueprint.md`
- `equus/docs/conventions/ui-layout-naming.md`

**Also open if a gap is found:** `equus/docs/conventions/loading-states.md`, `equus/docs/conventions/data-fetching.md`, `equus/docs/conventions/error-handling.md`, `equus/docs/conventions/ui-styling.md`, `equus/docs/engineering/errors.md`

**Code roots:** `equus/app/[locale]/horses/[horseId]/` (canonical), `equus/components/horses/`, `equus/components/errors/`, `equus/components/ui/`

**Test migration (this block):**

| From (mirror) | To (`__tests__/`) | Status |
|---------------|---------------------|--------|
| `tests/components/errors/sectionErrorBoundary.test.ts` | `components/errors/__tests__/sectionErrorBoundary.test.ts` | done |
| `tests/components/shared/unsavedChangesDiscard.test.ts` | `components/shared/__tests__/unsavedChangesDiscard.test.ts` | done |
| `tests/components/shared/pendingDialog.test.ts` | `components/shared/__tests__/pendingDialog.test.ts` | done |
| `tests/components/shared/confirmActionDialog.test.ts` | `components/shared/__tests__/confirmActionDialog.test.ts` | done |
| `tests/components/horses/hub/horseHubGalleryEmptyState.test.ts` | `components/horses/hub/__tests__/horseHubGalleryEmptyState.test.ts` | done |
| `tests/components/horses/media/horseMediaSetAsDialog.test.ts` | `components/horses/media/__tests__/horseMediaSetAsDialog.test.ts` | done |

**Check:**
- [x] Entity pages: thin `page.tsx` + `client.tsx` + `loading.tsx` using the named body skeleton
- [x] Layout is chrome-only (tabs); does not seed TanStack cache
- [x] Filename prefix + folder rules (`components/<entity>/`, shared vs entity-shared)
- [x] Section error boundaries vs toast/redirect used correctly
- [x] Parent-owned Save (one `useForm`, dirty → unsaved-changes) on Profile/Admin-style tabs
- [x] No unjustified `useRef` or imperative DOM in block code roots (senior-engineer)

**Out of scope:** Redesigning visual identity; adding new tabs.

**Tests:** `npm test -- components/errors/__tests__ components/shared/__tests__ components/horses/hub/__tests__ components/horses/media/__tests__` (18 passed). `npm run lint` (0 errors).  
**Real flow:** Verified Hub → Profile: `loading.tsx` and in-flight client both use `HorsePageContentSkeleton` under chrome-first `HorseLayoutChrome`; Profile/Admin register `useSetUnsavedDiscardHandler` so tab navigation restores saved values; `SectionErrorBoundary` on every tab section isolates crashes from EntityTabs.

**Findings:**

- **Canonical horse routes:** All eight tabs (Hub + seven sub-tabs) follow thin `page.tsx` → `client.tsx` + matching `loading.tsx` with `HorsePageContentSkeleton`.
- **Layout:** `[horseId]/layout.tsx` is chrome-only (`HorseLayoutChrome` + `EntityTabs`); no server-side TanStack seeding. Client fetches via `useHorseView`.
- **Hub gate:** Hub skips `HorsePageShell`; gated tabs use shell with redirect/toast patterns per role.
- **Naming:** `components/horses/<tab>/` + `horse-*` prefix; entity chrome at `components/horses/` root; cross-entity primitives in `components/shared/`.
- **Polished — error boundaries:** Replaced hand-rolled `ErrorBoundary`/`InlineErrorFallback` in Profile, Admin, Connect, Documents, Media, and History tab clients with `SectionErrorBoundary` + `resetKeys={[horseId]}` (Hub and Planning already matched).
- **Polished — Save/discard:** Horse Profile and Admin now register `useSetUnsavedDiscardHandler` so leaving with dirty form resets to last loaded horse values (same pattern as User preferences).
- **Senior engineer (retro):** Replaced `useRef` in `unsaved-changes-context.tsx` and `use-table.ts` / `data-table.tsx`; `beforeunload` retained with justification comment. `components/ui/sidebar.tsx` and `components/table/utils.ts` — imperative cookie/download patterns documented above (shadcn / file-save; no declarative alternative).
- **No unjustified imperative DOM:** Shared/table code roots compliant after retro pass (exceptions listed in retro table).

**Done when:** Horse (canonical) matches blueprint; later entity blocks reuse this verdict instead of re-litigating the pattern. ✅

---

### Block 3: Models and data lifecycle

**Review:** done  
**Verdict:** aligned  
**Date:** 2026-08-17

**Docs (only these):**
- `equus/docs/conventions/mongodb-models.md`
- `equus/docs/engineering/dataLifecycle.md`

**Also open if a gap is found:** `equus/docs/features/dataLifecycle.md`, `equus/docs/engineering/piiAnonymization.md`

**Code roots:** `equus/models/`, `equus/lib/lifecycle/`

**Test migration (this block):**

| From (mirror) | To (`__tests__/`) | Status |
|---------------|---------------------|--------|
| `tests/lib/lifecycle/deactivateDocument.test.ts` | `lib/lifecycle/__tests__/deactivateDocument.test.ts` | done |
| `tests/lib/lifecycle/anonymizeUserPii.test.ts` | `lib/lifecycle/__tests__/anonymizeUserPii.test.ts` | done |
| (new) | `lib/lifecycle/__tests__/activeQuery.test.ts` | done (created) |

**Check:**
- [x] Deactivate-not-delete on domain docs; `deactivationAuditFields` where listed
- [x] `Relationship` / `WorkplaceRelationship` end via status + timestamps, not delete
- [x] Hard-delete only for allowed exceptions (Cloudinary media/docs, compensating rollback, tests)
- [x] Discovery lists use active-only helpers
- [x] No accidental `findByIdAndDelete` on horses/users/stables/profiles

**Out of scope:** A full GDPR erasure job UI if it does not exist. If inactive-provider history is already hidden incorrectly, fix that here (existing lifecycle behavior). Do not invent a new anonymize product.

**Tests:** `npm test -- lib/lifecycle/__tests__` (14 passed).  
**Real flow:** Integration tests exercise `userService.softDelete` → tombstone + session version bump, then `anonymizeUserPii` scrubs PII while keeping `userId`; horse/document/history reads do not filter by uploader `isActive`.

**Findings:**

- **Tombstone fields:** `deactivationAuditFields` present on User, Horse, all host/user-linked entity profiles, Booking, Invoice, Notification, Rating, Media, Document, and deletion-request models. Lifecycle collections (`Relationship`, `WorkplaceRelationship`, `OwnershipTransfer`, `PedigreeConnection`) use status + timestamps per convention.
- **End-not-delete:** `relationshipService.endRelationship` sets `status: ended` + `endedAt`; `workplaceRelationshipService.endCollaboration` sets `status: ended` + `endedAt` + `endedReason`. No product-path hard delete on these.
- **Allowed hard deletes only:** `Media`/`Document` after Cloudinary destroy; compensating rollback on failed User↔profile link (user-linked create), email-failure rollback on pending `OwnershipTransfer`/`PedigreeConnection`/`WorkplaceRelationship`; test teardown in `tests/setup.ts`.
- **Discovery:** `discoverService`, `navigationService`, entity list paths, and `notificationService` use `mergeActiveOnly` / `filterActiveOperatorUserIds` / `profileLinkIsActive`.
- **Target — inactive provider history:** `listHorseDocuments`, `listAuditLogs`, and `listPlanning` do not exclude rows because `uploadedByUserId` or an actor user is inactive; only document/event tombstone (`isActive: false` on the file row) applies.
- **Account deactivation:** `userService.softDelete` → `deactivateDocument` with `refreshSessionVersion` bump; `authService`/`session.ts` reject inactive users on refresh and auth checks.
- **Test colocation:** Two mirror lifecycle suites moved; added `activeQuery.test.ts` for `mergeActiveOnly` / `isDocumentActive` / `assertDocumentActive`.
- **Senior engineer (retro):** `models/` and `lib/lifecycle/` are server-side only — no `useRef`, `window.*`, or `document.*` in production paths.

**Done when:** Lifecycle helpers and models match the engineering contract. ✅

---

## Phase B — Identity

### Block 4: Authentication

**Review:** done  
**Verdict:** polished  
**Date:** 2026-08-17

**Docs (only these):**
- `equus/docs/engineering/auth.md`
- `equus/docs/features/userModule.md` (section 1 Identity only)

**Code roots:** `equus/app/api/v1/auth/`, `equus/lib/services/authService.ts`, `equus/lib/auth/`, `equus/lib/api/auth/`, `equus/app/[locale]/{signin,signup,forgot-password,reset-password,confirm-email,resend-confirmation}/`

**Test migration (this block):**

| From (mirror) | To (`__tests__/`) | Status |
|---------------|---------------------|--------|
| `tests/lib/services/authService.test.ts` | `lib/services/__tests__/authService.test.ts` | done |
| `tests/lib/auth/{requireAuth,clearClientAuthSession,googleAccountLinking,session,establishSession,jwt,config,serverSession,touchUserLastActive}.test.ts` | `lib/auth/__tests__/` | done |
| `tests/lib/api/authClient*.test.ts` (auth client suites) | `lib/api/auth/__tests__/` | done |
| `tests/lib/navigation/postAuthRedirect.test.ts` | `lib/navigation/__tests__/postAuthRedirect.test.ts` | done |
| `tests/lib/validations/{auth,authForms}.test.ts` | `lib/validations/__tests__/` | done |
| `tests/components/auth/auth-components.test.ts` | `components/auth/__tests__/auth-components.test.ts` | done |
| `app/api/v1/auth/me/route.get.test.ts` | already colocated (Block 1) | n/a |
| (new) | `lib/api/__tests__/fetchWithAuth.test.ts` | done (created) |

**Left in `tests/` (other blocks):** `tests/lib/auth/workplaceRelationshipPermissions.test.ts` (Block 18); `tests/lib/api/authClient.ownershipTransfers.test.ts` (invites).

**Check:**
- [x] Credentials register/login/logout/refresh/me
- [x] Google is transport only; REST cookies via `POST /auth/session`
- [x] Inactive users rejected on refresh and `requireAuthFromRequest`
- [x] Post-auth redirect: `/home` or safe `?next=`
- [x] Email confirm + password reset
- [x] `apiFetch` 401 retry rules (retry refresh once; do not retry on login/register/logout/session/`/auth/me`)

**Out of scope:** Changing `/home` content (Block 20); adding a new IdP.

**Tests:** `npm test -- lib/services/__tests__/authService.test.ts lib/auth/__tests__ lib/api/auth/__tests__ lib/api/__tests__/fetchWithAuth.test.ts lib/navigation/__tests__/postAuthRedirect.test.ts lib/validations/__tests__/auth app/api/v1/auth/me/__tests__ components/auth/__tests__` (104 passed). `npm run lint` (0 errors).  
**Real flow:** Code-traced credentials register/login/refresh/logout; Google bridge via `ensureRestSession` → `POST /auth/session`; logout navigates to `/` then `clearClientAuthSession`; deactivate → `DELETE /users/me` + sign-in redirect; inactive user rejected on refresh, `/auth/me`, and `requireAuthFromRequest`.

**Findings:**

- **REST session truth:** All auth routes under `/api/v1/auth/*` present; `useAppAuth` derives `isAuthenticated` from REST user via `ensureRestSession`, not NextAuth alone.
- **Credentials:** Register/login/refresh/logout/me; unverified credentials login returns `EMAIL_NOT_VERIFIED`; email confirm and password reset client helpers call the documented routes.
- **Google:** `POST /auth/session` bridges NextAuth → REST cookies; `ensureRestSession` probes `/auth/me` first and only calls session bridge when REST cookies missing.
- **Inactive rejection:** `buildAuthUserSessionFromUserId`, `assertUserAccountActive`, `validateCredentials`, refresh (via `establishSession`), `GET /auth/me`, and `requireAuthFromRequest` all reject `isActive: false`; softDelete bumps `refreshSessionVersion`.
- **Post-auth redirect:** `resolvePostAuthPath` open-redirect safe; default `/home`; blocks `/`, `/signin`, `/signup`, legacy `/me`.
- **Logout:** `AppAuthProvider.logout` → `router.replace("/")` then `clearClientAuthSession` (NextAuth signOut + `POST /auth/logout`); never lands on `/signin` for voluntary logout.
- **401 retry:** `AUTH_NO_REFRESH_PATHS` excludes login/register/logout/refresh/session/me; `fetchWithAuth` retries protected routes once after refresh — covered by new colocated test.
- **Test colocation:** Eighteen mirror suites moved; `fetchWithAuth.test.ts` added for retry rules.
- **Senior engineer (retro):** `AppAuthProvider` session-restore guards moved from `useRef` to `hasEverResolvedUser` state + effect cleanup flag.

**Done when:** Both credentials and Google produce the same REST session; logout/deactivate hold for all those paths. ✅

---

### Block 5: User profile and preferences

**Review:** done  
**Verdict:** aligned  
**Date:** 2026-08-17

**Docs (only these):**
- `equus/docs/engineering/profile.md`
- `equus/docs/features/userModule.md` (section 2 Personal profile)

**Code roots:** `equus/app/[locale]/user/[userId]/{profile,preferences}/`, `equus/app/[locale]/profile/`, `equus/components/user/profile/`, `equus/lib/services/userService.ts`, `equus/app/api/v1/users/me/`

**Test migration (this block):**

| From (mirror) | To (`__tests__/`) | Status |
|---------------|---------------------|--------|
| `tests/lib/services/userService.test.ts` | `lib/services/__tests__/userService.test.ts` | done |
| `tests/lib/validations/{profileForms,user}.test.ts` | `lib/validations/__tests__/` | done |
| `tests/lib/utils/{profileFormMapping,preferencesFormMapping}.test.ts` | `lib/utils/__tests__/` | done |
| `tests/lib/profile/incompleteProfileBanner.test.ts` | `lib/profile/__tests__/incompleteProfileBanner.test.ts` | done |
| `tests/components/user/profile/*.test.ts` | `components/user/profile/__tests__/` | done |
| `tests/components/user/preferences/preferences-form.test.ts` | `components/user/preferences/__tests__/preferences-form.test.ts` | done |
| `tests/components/user/user-page-shell.test.ts` | `components/user/__tests__/user-page-shell.test.ts` | done |
| `app/api/v1/users/me/route.delete.test.ts` | already colocated (Block 4) | n/a |

**Check:**
- [x] `/profile` redirects to `/user/{me}/profile`
- [x] `userId` must match session
- [x] PATCH dirty fields only; `""` → `$unset`
- [x] Theme/language preview live; persist on Save; discard restores
- [x] Avatar multipart PATCH
- [x] `profileComplete` banner except on account settings
- [x] Deactivate copy is deactivate, not “delete account”; tombstone + logout

**Out of scope:** User Hub (Block 21); Subscription tab (Block 22 / 26).

**Tests:** `npm test -- lib/services/__tests__/userService.test.ts lib/validations/__tests__/profileForms.test.ts lib/validations/__tests__/user.test.ts lib/utils/__tests__/profileFormMapping.test.ts lib/utils/__tests__/preferencesFormMapping.test.ts lib/profile/__tests__ components/user/profile/__tests__ components/user/preferences/__tests__ components/user/__tests__/user-page-shell.test.ts app/api/v1/users/me/__tests__` (61 passed).  
**Real flow:** Code-traced `/profile` redirect; `UserPageShell` self-only gate; profile Save/discard + preferences theme/locale preview; multipart avatar via `PATCH /users/me`; deactivate dialog copy and `DELETE /users/me` tombstone + cookie clear.

**Findings:**

- **`/profile` redirect:** Client page resolves REST user id → `userProfilePath(user.id)`; unauthenticated → sign-in with `/profile` preserved.
- **Self-only:** `UserPageShell` redirects when `user.id !== userId`; shows skeleton until auth + view load.
- **PATCH contract:** `updatePersonalDetails` builds `$set`/`$unset`; empty string clears optional fields; route accepts JSON or multipart (fields + avatar).
- **Preferences:** Live theme/locale preview while dirty; Save persists cookies + DB; `useSetUnsavedDiscardHandler` restores on tab leave.
- **Profile complete:** `shouldShowIncompleteProfileBanner` hides on `/profile` and `/user/{id}/profile|preferences`; inline banner on profile page when incomplete.
- **Deactivate:** i18n uses “Deactivate account”; `ProfileDeactivateAccount` → `DELETE /users/me`; tombstone + logout cookies (route test confirms refresh fails after).
- **Test colocation:** Ten mirror suites moved; no Block 5 mirror copies remain under `tests/`.
- **Senior engineer (retro):** Profile/preferences UI has no `useRef`; theme preview uses justified `lib/theme/appTheme.ts`; debounced map geocode uses `window.setTimeout` only (timer, not DOM).

**Done when:** Settings Save/discard and deactivate match profile.md for credentials and Google users. ✅

---

### Block 6: i18n

**Review:** done  
**Verdict:** aligned  
**Date:** 2026-08-17

**Docs (only these):**
- `equus/docs/engineering/i18n.md`
- `equus/docs/conventions/i18n.md`

**Code roots:** `equus/i18n/`, `equus/messages/en.json`, `equus/messages/es.json`, `equus/proxy.ts`

**Test migration (this block):**

| From (mirror) | To (`__tests__/`) | Status |
|---------------|---------------------|--------|
| `tests/i18n/resolveLocale.test.ts` | `i18n/__tests__/resolveLocale.test.ts` | done |
| `tests/i18n/messages.test.ts` | `i18n/__tests__/messages.test.ts` | done |

**Check:**
- [x] Locales `en` (default, unprefixed) and `es` (`/es/…`)
- [x] Path slugs stay English
- [x] No hardcoded user-facing strings in reviewed surfaces (sample auth + horse Hub)
- [x] `en` / `es` message key parity
- [x] `NEXT_LOCALE` synced on register, login, Google bridge, preferences Save
- [x] No header language switcher (preferences only)

**Out of scope:** Adding Portuguese (`pt`) — no locale implementation exists yet (**greenfield**). Record the gap only.

**Tests:** `npm test -- i18n/__tests__` (7 passed).  
**Real flow:** Routing uses `localePrefix: 'as-needed'`; sign-in applies `preferredLanguage` after credentials login; preferences Save calls `syncLocaleCookie`; auth routes attach `NEXT_LOCALE` on register/login/session.

**Findings:**

- **Shipped locales:** `routing.ts` — `en`, `es`, default `en`, prefix `as-needed`; `appLocaleEnums` matches; no `messages/pt.json`.
- **Path slugs:** English segments (`/es/signin`, `/es/horses/…`) via next-intl middleware in `proxy.ts`.
- **Messages:** Auth components and horse Hub use `useTranslations`; `messages.test.ts` confirms en/es key parity.
- **Cookie sync:** `attachLocaleCookie` on `POST /auth/register`, `/auth/login`, `/auth/session` (Google bridge); `syncLocaleCookie` on preferences Save; sign-in client aligns URL locale to `preferredLanguage` after login.
- **No header switcher:** Language control only in `UserAppearanceSection` (preferences tab); sidebar/layout has no locale picker.
- **Greenfield — Portuguese:** Engineering **Target** (`pt` first-class locale) not built; `normalizeLocale('pt')` falls back to `en`; eng. doc stays **drift** until a future locale block ships `pt`.
- **Polished — stale comments:** Removed incorrect “locale switcher” references in `auth-page-shell.tsx` and `syncLocaleCookie.ts` file headers.
- **Senior engineer (retro):** `set-html-lang.tsx` sets `<html lang>` imperatively (root layout owns `<html>` — justified). `syncLocaleCookie.ts` writes `document.cookie` after preferences Save (no React cookie API).

**Done when:** en/es behave as current i18n docs. `pt` listed as greenfield. ✅

---

### Block 7: Guest landing

**Review:** done  
**Verdict:** aligned  
**Date:** 2026-08-17

**Docs (only these):**
- `equus/docs/engineering/auth.md` (guest `/` vs post-auth `/home`)
- `equus/docs/engineering/page-flow-blueprint.md`

**Code roots:** `equus/app/[locale]/page.tsx`, `equus/app/[locale]/client.tsx`, `equus/components/home/`

**Test migration (this block):**

| From (mirror) | To (`__tests__/`) | Status |
|---------------|---------------------|--------|
| Guest sections of `tests/components/home/home-page.test.ts` | `components/home/__tests__/home-guest-components.test.ts` | done |
| `GuestLandingContent` tests (same file) | `app/[locale]/__tests__/guest-landing.test.ts` | done (created; asserts `/home` redirect) |
| `HomeContent` + signed-in panel tests (same file) | **keep** in `tests/components/home/home-page.test.ts` until Block 20 | deferred |

**Check:**
- [x] Unauthenticated `/` is marketing/guest landing
- [x] Authenticated users redirect to `/home`
- [x] Sign-in / sign-up links are locale-aware
- [x] Thin page + client + loading skeleton

**Out of scope:** Home inbox body (Block 20). This block only keeps guest `/` vs signed-in redirect correct.

**Tests:** `npm test -- app/[locale]/__tests__/guest-landing.test.ts components/home/__tests__/home-guest-components.test.ts` (7 passed).  
**Real flow:** `GuestLandingContent` shows guest hero + CTA when logged out; `router.replace(USER_HOME_PATH)` when authenticated; `HomeGuestPanel` uses `@/i18n/navigation` `Link` for `/signin` and `/signup`; `[locale]/loading.tsx` uses `HomePageContentSkeleton`.

**Findings:**

- **Guest `/`:** Thin `page.tsx` → `GuestLandingContent`; marketing copy via `useTranslations("home")`; `SectionErrorBoundary` on hero and CTA.
- **Signed-in redirect:** `useEffect` → `router.replace(USER_HOME_PATH)` (`/home`); skeleton shown while auth resolves or during redirect (no flash of guest CTA).
- **Locale-aware links:** `HomeGuestPanel` uses i18n `Link` (not `next/link`).
- **Loading:** `app/[locale]/loading.tsx` shares `HomePageContentSkeleton` with in-flight client state.
- **Block 20 leftover:** Mirror `tests/components/home/home-page.test.ts` still holds `HomeContent` / signed-in roster tests — migrate in Block 20 when `/home` inbox is reviewed.
- **Senior engineer (retro):** Guest landing uses declarative React only (`useEffect` + `router.replace`); no `useRef` or imperative DOM in `page.tsx` / `client.tsx` / `components/home/`.

**Done when:** Guest vs signed-in split matches auth + blueprint. ✅

---

## Phase C — Horse (largest shipped product)

Horse tabs are locked: Hub · Connect · Planning · Media · Documents · Profile · Admin · History. Do not rename or resurrect Medical/Feed as horse ops tabs.

### Block 8: Horse core — REST, visibility, tabs, list/create

**Review:** done  
**Verdict:** polished  
**Date:** 2026-08-17

**Docs (only these):**
- `equus/docs/engineering/horses.md` (**Shipped** first)
- `equus/docs/engineering/horseTabs.md`
- `equus/docs/conventions/visibility.md`

**Also open if needed:** `equus/docs/features/horseModule.md` (principles + profile/discovery tables only)

**Code roots:** `equus/app/api/v1/horses/`, `equus/lib/services/horseService.ts`, `equus/lib/horses/`, `equus/models/Horse.ts`, `equus/app/[locale]/horses/`, `equus/lib/navigation/horseTabs.ts`

**Test migration (this block):**

| From (mirror) | To (`__tests__/`) | Status |
|---------------|---------------------|--------|
| `tests/lib/services/horseService.test.ts` | `lib/services/__tests__/horseService.test.ts` | done |
| `tests/lib/services/horseHubSections.test.ts` | `lib/services/__tests__/horseHubSections.test.ts` | done |
| `tests/lib/services/horseHubSocial.test.ts` | `lib/services/__tests__/horseHubSocial.test.ts` | done |
| `tests/lib/horses/horseVisibilityAccess.test.ts` | `lib/horses/__tests__/horseVisibilityAccess.test.ts` | done |
| `tests/lib/horses/horseDiscoveryAccess.test.ts` | `lib/horses/__tests__/horseDiscoveryAccess.test.ts` | done |
| `tests/lib/utils/horseIdentity.test.ts` | `lib/utils/__tests__/horseIdentity.test.ts` | done |
| `tests/lib/validations/horse.test.ts` | `lib/validations/__tests__/horse.test.ts` | done |
| `app/api/v1/horses/[id]/__tests__/route.get.test.ts` | (already colocated) | done |

**Deferred:** `tests/lib/validations/horseForms.test.ts` (create form UI — Block 10), `tests/lib/utils/horseFormMapping.test.ts` (Block 10), `tests/models/horse.test.ts` (model defaults), `tests/lib/horses/horseSubscriptionBilling.test.ts` (Block 26).

**Check:**
- [x] Create/list/get/patch/discovery/hub-sections match the **current** horse contract (Target where it applies to this existing module)
- [x] `GET /horses/:id` is cheap Hub; social/gallery are extra routes
- [x] L1 `profileVisibility` deny → 404; L2 `hubSections` modes enforced
- [x] `allowedTabs` / `viewerRole` match horseTabs.md (guest = Hub only)
- [x] List default owned for auth; guests see public
- [x] Create: `/horses/new` (media then `POST /horses`)
- [x] **Remove or stop** owner-tier billing on `POST /horses` (horses are free). If Stripe cutover is not done yet, at least stop the horse-count guard here; Block 26 finishes entity billing
- [x] No waiting-transfer flag — that capability is **greenfield** (Block 28). Do not invent it here

**Out of scope:** Favorites list filter (not built). Waiting-transfer. Building stable whiteboard/finance. Planning write-surface is Block 14.

**Tests:** `npm test -- lib/services/__tests__/horseService.test.ts lib/services/__tests__/horseHubSections.test.ts lib/services/__tests__/horseHubSocial.test.ts lib/horses/__tests__/horseVisibilityAccess.test.ts lib/horses/__tests__/horseDiscoveryAccess.test.ts lib/utils/__tests__/horseIdentity.test.ts lib/validations/__tests__/horse.test.ts app/api/v1/horses/[id]/__tests__/route.get.test.ts` (61 passed).  
**Real flow:** Free-tier user can create 2+ horses; `listHorses` defaults `mine=true` when authenticated (`horse-list-page.tsx`); guest `getHorseView` → `allowedTabs: ["hub"]`; owner → full tabs; L1 deny → 404; hub-social/hub-gallery are separate from cheap `GET /horses/:id`.

**Findings:**

- **Billing fix:** Removed `guardHorseCreation` from `horseService.createHorse` — horses are free per Target / horseModule principle 3. `guardAcceptTransfer` and subscription UI remain for Block 26.
- **REST contract:** Thin routes delegate to `horseService`; `getHorseView` returns cheap Hub sections only; `getHorseHubSocial` / hub-gallery are separate.
- **Visibility:** L1/L2 enforced in `horseVisibilityAccess.ts`; discovery PATCH and hub-sections PATCH tested.
- **Tabs:** `TAB_MIN_ROLE` + `deriveAllowedTabs` match horseTabs.md; `getHorseTabs` falls back to hub-only while loading.
- **List/create UI:** `/horses` public metadata; authenticated list defaults `mine: true`; `/horses/new` → `CreateHorsePage` with sign-in redirect; create form uploads media then `POST /horses`.
- **Greenfield (not built):** waiting-transfer flag on `Horse`, favorites filter on list — recorded only.
- **Eng. doc:** Updated `horses.md` Shipped row for `POST /horses` (free, no cap). Module status stays **drift** (planning writes still on horse API — Block 14).
- **Senior engineer (retro):** `horse-create-form.tsx` — removed `abortRef`; `AbortController` lives in the submit handler only. Horse list/create UI: no unjustified `window.*` / `document.*`.

**Done when:** Existing horse create/list/visibility/tabs match current docs. Horses are not paywalled. Greenfield horse items are named, not built. ✅

---

### Block 9: Horse Hub

**Review:** done  
**Verdict:** polished  
**Date:** 2026-08-17

**Docs (only these):**
- `equus/docs/engineering/horseTabs.md`
- `equus/docs/features/horseModule.md` (section 5 Hub)

**Code roots:** `equus/app/[locale]/horses/[horseId]/{page,client,loading}.tsx`, `equus/components/horses/hub/`, hub-social / hub-gallery routes

**Test migration (this block):**

| From (mirror) | To (`__tests__/`) | Status |
|---------------|---------------------|--------|
| `tests/components/horses/hub/horseHubGalleryEmptyState.test.ts` | `components/horses/hub/__tests__/horseHubGalleryEmptyState.test.ts` | done (Block 2) |
| `tests/lib/services/horseHubSections.test.ts` | `lib/services/__tests__/horseHubSections.test.ts` | done (Block 8) |
| `tests/lib/services/horseHubSocial.test.ts` | `lib/services/__tests__/horseHubSocial.test.ts` | done (Block 8) |
| (new) | `components/horses/hub/__tests__/horseHubDisciplines.test.ts` | done (created) |
| (new) | `app/[locale]/horses/[horseId]/__tests__/hub-content.test.ts` | done (created) |

**Check:**
- [x] Hub is read-only social (hero, about, media subset, pedigree, people)
- [x] No care/invoice/ops editing on Hub
- [x] Hub renders only keys present in `horse.sections`
- [x] Guest path skips ownership `HorsePageShell`
- [x] Layer-2 popovers follow visibility convention

**Out of scope:** Public gallery subset market backlog (H-FD-09) unless already shipped.

**Tests:** `npm test -- lib/services/__tests__/horseHubSections.test.ts lib/services/__tests__/horseHubSocial.test.ts components/horses/hub/__tests__ app/[locale]/horses/[horseId]/__tests__/hub-content.test.ts` (27 passed).  
**Real flow:** Code-traced guest Hub (`HubContent` without `HorsePageShell`; `allowedTabs: ["hub"]`); owner Hub with hero image upload (social identity only); L2 gallery presence marker hides Media column when `hubSections.gallery` is owner-only for guests; section cards (about/value/pedigree/people/disciplines) return null when key absent; no `SectionVisibilityControl` on Hub components.

**Findings:**

- **Read-only social:** Hub sections are display-only (about, pedigree, people, value, disciplines, gallery lightbox). Owner hero/profile image upload is social identity, not care/ops. No planning/connections/invoices on Hub UI (those list keys stay on `GET …/hub-social` only — not rendered on Hub).
- **Guest path:** Hub `client.tsx` renders directly under `HorseLayoutChrome`; gated tabs use `HorsePageShell`.
- **L2 popovers:** None on Hub per `visibility.md`; visibility controls live on Profile/Admin/Connect tabs.
- **Polished — gallery gating:** `getHorseView` now sets `sections.gallery = []` when Layer 2 allows (presence marker; paginated items via `GET …/hub-gallery`). `HubContent` omits `HorseHubGallery` when the key is absent — fixes empty Media card for L2-denied viewers.
- **Polished — disciplines L2:** `HorseHubDisciplines` no longer falls back to owner-team `horse.disciplines` when `sections.identity` is absent (prevents L2 leak).
- **Test colocation:** All hub mirror tests migrated in Blocks 2/8; two new colocated UI tests added.
- **Senior engineer (retro):** `horse-hub-gallery.tsx` — removed `window.resize`; `useHubGalleryPageSize` hook. `horse-hub-share-menu.tsx` — `shareUrl` from server, not `window.location`.

**Done when:** Hub is social display only and respects L1/L2. ✅

### Block 10: Horse Profile and pedigree UI

**Review:** done  
**Verdict:** aligned  
**Date:** 2026-08-17

**Docs (only these):**
- `equus/docs/engineering/horseTabs.md`
- `equus/docs/features/horseModule.md` (section 1 identity; pedigree rows)

**Also open if needed:** `equus/docs/engineering/pedigreeConnections.md` (UI entry points only; API is Block 17)

**Code roots:** `equus/app/[locale]/horses/[horseId]/profile/`, `equus/components/horses/profile/`, `equus/lib/utils/horseFormMapping.ts`, `equus/lib/utils/horseProfilePatch.ts`

**Test migration (this block):**

| From (mirror) | To (`__tests__/`) | Status |
|---------------|---------------------|--------|
| `tests/lib/validations/horseForms.test.ts` | `lib/validations/__tests__/horseForms.test.ts` | done |
| `tests/lib/utils/horseFormMapping.test.ts` | `lib/utils/__tests__/horseFormMapping.test.ts` | done |
| (new) | `lib/utils/__tests__/horseProfilePatch.test.ts` | done (created) |

**Check:**
- [x] Parent-owned Save; identity / pedigree / about
- [x] Min role `responsible` for Profile tab
- [x] Pedigree connect entry does not change ownership
- [x] Commercial/value fields exist only if still in Shipped identity (do not add sale marketplace)

**Out of scope:** Pedigree inbox API (Block 17).

**Tests:** `npm test -- lib/validations/__tests__/horseForms.test.ts lib/utils/__tests__/horseFormMapping.test.ts lib/utils/__tests__/horseProfilePatch.test.ts lib/services/__tests__/horseHubSections.test.ts` (30 passed).  
**Real flow:** Code-traced Profile tab: single `useForm` + Save button; `useSetUnsavedDiscardHandler` restores on tab leave; four sections (identity, identification, pedigree, about) with Layer-2 `HorseSectionVisibility` autosave popovers; pedigree connect via `POST /api/v1/pedigree-connections` (not ownership transfer); commercial fields on Admin only (`horse-value-section.tsx`).

**Findings:**

- **Parent-owned Save:** `ProfileForm` owns one form; dirty-only PATCH via `buildProfileSavePatches`; visibility modes autosave separately per convention.
- **Min role responsible:** `TAB_MIN_ROLE.profile = responsible`; `HorsePageShell requireOwnership` gates on `isAdmin` (main owner, co-owner, or responsible) — matches owner-team edit access.
- **Pedigree connect:** `HorsePedigreeSection` uses `useCreatePedigreeConnection` → `POST /api/v1/pedigree-connections`; disconnect clears pedigree fields via `PATCH /horses/:id` (immediate, not Save-batched — consent/link lifecycle).
- **Commercial fields:** Profile form/schema has no sale/value fields; H-PROF-09 commercial fields live on Admin tab only.
- **Blueprint:** Thin `page.tsx` + `client.tsx` + `loading.tsx` with `HorsePageContentSkeleton`.
- **Test colocation:** Two mirror suites moved; `horseProfilePatch.test.ts` and profile-form schema tests added.
- **Senior engineer (retro):** Profile code roots had no `useRef`; checklist satisfied.

**Done when:** Profile Save matches blueprint + locked tab role. ✅

### Block 11: Horse Connect, relationships, reviews

**Review:** done  
**Verdict:** polished  
**Date:** 2026-08-17

**Docs (only these):**
- `equus/docs/engineering/relationships.md`
- `equus/docs/features/horseModule.md` (section 4 Provider relationships)

**Code roots:** `equus/app/api/v1/relationships/`, `equus/app/api/v1/horses/[id]/relationships/`, `equus/lib/services/relationshipService.ts`, `equus/app/[locale]/horses/[horseId]/connect/`, `equus/app/[locale]/relationships/`, `equus/components/invites/`, review routes/services

**Test migration (this block):**

| From (mirror) | To (`__tests__/`) | Status |
|---------------|---------------------|--------|
| `tests/lib/services/relationshipService.test.ts` | `lib/services/__tests__/relationshipService.test.ts` | done |
| `tests/lib/services/reviewService.test.ts` | `lib/services/__tests__/reviewService.test.ts` | done |
| `tests/lib/services/discoverService.test.ts` | `lib/services/__tests__/discoverService.test.ts` | done |
| `tests/lib/email/relationshipInvite.test.ts` | `lib/email/__tests__/relationshipInvite.test.ts` | done |
| `tests/components/invites/relationships-content.test.ts` | `components/invites/__tests__/relationships-content.test.ts` | done |
| (new) | `components/horses/connect/__tests__/horse-connect-invite-dialog.test.ts` | done (created) |

**Check:**
- [x] Owner/co-owner creates; provider accepts/declines
- [x] Email invite for unregistered (`invitedEmail` + preview)
- [x] Established rows permanent; `ended` keeps history
- [x] Entity-owned providers require `receiverAccountId`
- [x] Connect tab min role `responsible`
- [x] Horse-scoped reviews + reviewee response if shipped
- [x] Inbox `/relationships` is AuthPageShell (not entity tabs)
- [x] Discover providers picker is **not** people search (`/discover/providers`, not `/users/search` as a directory)

**Out of scope:** Stable-created boarded horse (waiting-transfer); workplace (Block 18).

**Tests:** `npm test -- lib/services/__tests__/relationshipService.test.ts lib/services/__tests__/reviewService.test.ts lib/services/__tests__/discoverService.test.ts lib/email/__tests__/relationshipInvite.test.ts components/invites/__tests__/relationships-content.test.ts components/horses/connect/__tests__/horse-connect-invite-dialog.test.ts` (45 passed).  
**Real flow:** Code-traced owner invite via Connect dialog → `HorseProviderInvites` + `GET /discover/providers`; email invite + `GET /invites/preview?ref=`; provider inbox `/relationships` (`AuthPageShell`, accept/decline); connections table shows accepted, pending, and ended; service tests cover resend-after-decline, entity-owned validation, bidirectional reviews + reviewee response.

**Findings:**

- **REST aligned:** `POST /relationships`, `PATCH /relationships/:id`, horse-scoped pending/providers routes, `GET /users/me/relationships?status=pending`, and review routes match `relationships.md`. Validation enforces `receiverAccountId` for entity-owned types.
- **Polished — Connect invite picker:** `HorseConnectInviteDialog` wrongly used `UserInviteSection` + `/api/v1/search/entities`. Replaced with `HorseProviderInvites` → `ProviderInvitePicker` → `GET /api/v1/discover/providers` per docs.
- **Polished — Connect table:** Loads ended providers (H-REL-06 history); maps `declined` status to refused label; resend includes `receiverAccountId` for profile-based pending invites.
- **Polished — provider picker:** Replaced `window.setTimeout` debounce with `useDebouncedValue`; added `onInvited` callback to close Connect dialog after success.
- **Inbox:** `/relationships` uses `AuthPageShell` + `RelationshipsContent`; deep-link `?relationship=` from email; unauthenticated redirect to sign-in.
- **Connect tab:** `HorsePageShell requireOwnership` (owner team / `responsible`+); `TAB_MIN_ROLE.connect = responsible`.
- **Reviews:** API + hooks shipped (`POST/GET …/reviews`, `PATCH /reviews/:id/response`); no Connect-tab review UI yet — REST-only surface; feature IDs H-REL-07/08 satisfied at API layer.
- **Greenfield (not built):** H-REL-01b stable-created boarded horse (waiting-transfer).
- **Senior engineer:** Connect/invites code roots — no `useRef`; debounce via `useDebouncedValue` (timer in effect, not DOM). Removed stale unused imports on reviews route.

**Done when:** Both invite paths that are shipped (owner→provider, email) work; Connect + inbox match docs. ✅

---

### Block 12: Horse Media

**Review:** done  
**Verdict:** polished  
**Date:** 2026-08-17

**Docs (only these):**
- `equus/docs/engineering/horses.md` (media rows)
- `equus/docs/engineering/dataLifecycle.md` (file-asset exception)

**Code roots:** `equus/app/api/v1/horses/[id]/media/`, `equus/lib/services/mediaService.ts`, `equus/lib/services/mediaDeletionService.ts`, `equus/app/[locale]/horses/[horseId]/media/`

**Test migration (this block):**

| From (mirror) | To (`__tests__/`) | Status |
|---------------|---------------------|--------|
| `tests/lib/services/mediaService.test.ts` | `lib/services/__tests__/mediaService.test.ts` | done (Block 1) |
| `tests/lib/services/mediaDeletionService.test.ts` | `lib/services/__tests__/mediaDeletionService.test.ts` | done |
| `tests/components/horses/media/horseMediaSetAsDialog.test.ts` | `components/horses/media/__tests__/horseMediaSetAsDialog.test.ts` | done (Block 2) |
| media visibility PATCH route test | `app/api/v1/horses/[id]/media/[mediaId]/visibility/__tests__/route.patch.test.ts` | done (Block 1) |

**Check:**
- [x] Upload via Cloudinary; gallery on Media tab (`related`+)
- [x] Owner team can hard-delete; others use deletion requests
- [x] Visibility on media items
- [x] Hub gallery is a subset route, not a second write API

**Out of scope:** Injury-photo market backlog.

**Tests:** `npm test -- lib/services/__tests__/mediaService.test.ts lib/services/__tests__/mediaDeletionService.test.ts components/horses/media/__tests__ app/api/v1/horses/[id]/media/[mediaId]/visibility/__tests__` (45 passed).  
**Real flow:** Code-traced Cloudinary upload route → `createMedia`; Media tab gated by `TAB_MIN_ROLE.media = related`; owner team (`isAdmin`) gets upload/visibility/delete/set-as; related non-owners get deletion-request dialog → `POST …/media-deletion-requests`; Hub uses read-only `GET …/hub-gallery` (`listHorseHubGallery`); hard-delete destroys Cloudinary then MongoDB.

**Findings:**

- **REST aligned:** Upload, list, delete, visibility PATCH, hub-gallery read, and media-deletion-request routes match `horses.md` + file-asset exception in `dataLifecycle.md`.
- **Polished — createMedia gate:** `createMedia` now requires owner team (same `ownedByUserQuery` as delete/visibility) — blocks non-owner uploads at the service layer.
- **Polished — Media tab UI:** Gallery showed owner-only controls (upload, visibility, hard-delete) to all viewers. Now `canManageMedia={horse.isAdmin}` gates management actions; related viewers get **Request deletion** → `useCreateMediaDeletionRequest`.
- **Hub subset:** `listHorseHubGallery` is paginated read-only; Hub lightbox omits admin callbacks (Block 9). No second write API on hub-gallery.
- **Visibility:** Per-item `visibilityMode` + `isVisibleOnHub` on Media tab; L2 gallery section visibility on tab chrome.
- **Test colocation:** `mediaDeletionService` mirror migrated; `createMedia` tests updated for ownership gate.
- **Senior engineer:** Media gallery uses declarative React + blob URL cleanup on upload preview remove; no `useRef` for DOM in block code roots.

**Done when:** Media lifecycle matches file-asset exception. ✅

---

### Block 13: Horse Documents

**Review:** done  
**Verdict:** polished  
**Date:** 2026-08-17

**Docs (only these):**
- `equus/docs/engineering/horses.md` (documents rows)
- `equus/docs/features/horseModule.md` (section 8 — **Shipped** rows only)

**Code roots:** `equus/app/api/v1/horses/[id]/documents/`, `equus/lib/services/horseDocumentService.ts`, `equus/lib/services/documentDeletionService.ts`, `equus/app/[locale]/horses/[horseId]/documents/`

**Test migration (this block):**

| From (mirror) | To (`__tests__/`) | Status |
|---------------|---------------------|--------|
| `tests/lib/services/horseDocumentService.test.ts` | `lib/services/__tests__/horseDocumentService.test.ts` | done |
| `tests/lib/services/documentDeletionService.test.ts` | `lib/services/__tests__/documentDeletionService.test.ts` | done |
| `tests/lib/cloudinary/documentDelivery.test.ts` | `lib/cloudinary/__tests__/documentDelivery.test.ts` | done |
| `tests/lib/cloudinary/resourceTypeFromMime.test.ts` | `lib/cloudinary/__tests__/resourceTypeFromMime.test.ts` | done |

**Check:**
- [x] Upload/list/download/delete policy matches media
- [x] Documents tab is display + owner file uploads as the current horse contract
- [x] **Do not** add an invoices section if entity invoicing does not exist yet (greenfield)
- [x] Horse Documents must not become the stable ops write surface. If current UI implies the horse runs invoices/care, correct that copy and write paths. Entity invoice APIs wait for stable ops (greenfield)

**Out of scope:** Folders/tags (not built). Building a stable finance module. Entity-issued invoices.

**Tests:** `npm test -- lib/services/__tests__/horseDocumentService.test.ts lib/services/__tests__/documentDeletionService.test.ts lib/cloudinary/__tests__` (32 passed).  
**Real flow:** Code-traced owner upload via Cloudinary; related+ viewer download (`assertHorseDocumentTabAccess`); owner hard-delete; related non-owner deletion request; no entity invoices section UI.

**Findings:**

- **REST aligned:** Document upload/list/download/delete + document-deletion-requests match media-style file-asset policy in `dataLifecycle.md`.
- **Polished — createHorseDocument gate:** Upload now requires owner team (same as delete).
- **Polished — download access:** `getHorseDocumentDownloadMeta` allows related+ tab viewers (not owner-only); strangers without relationship get 403.
- **Polished — Documents tab UI:** Upload button and dialog owner-only (`horse.isAdmin`); table gates hard-delete vs deletion-request like Media tab; download remains for all tab viewers.
- **Shipped-only scope:** H-DOC-01/06 done; H-DOC-02 folders/tags, H-DOC-05 permission-scoped access, H-DOC-07 entity invoices section remain **planned/greenfield**. Owner-upload `invoice` document type is a file category, not an entity billing section.
- **Copy:** Upload description lists owner files (passports, insurance, contracts) — no stable-ops or entity-invoice language.
- **Test colocation:** Four mirror suites migrated to `__tests__/`.
- **Senior engineer:** Download uses justified anchor injection (browser save — same pattern as `components/table/utils.ts`); no `useRef` in block code roots.

**Done when:** File policy matches docs. Horse is not treated as the ops/invoice system. Missing entity invoices named as greenfield. ✅

---

### Block 14: Horse Planning

**Review:** done  
**Verdict:** polished  
**Date:** 2026-08-17

**Docs (only these):**
- `equus/docs/engineering/horses.md` (**Shipped** then **Target** — planning is an existing feature)
- `equus/docs/features/horseModule.md` (section 6)

**Code roots:** `equus/app/api/v1/horses/[id]/planning/`, `equus/lib/services/horsePlanningService.ts`, `equus/app/[locale]/horses/[horseId]/planning/`

**Test migration (this block):**

| From (mirror) | To (`__tests__/`) | Status |
|---------------|---------------------|--------|
| (new) | `lib/services/__tests__/horsePlanningService.test.ts` | done (created) |

**Check:**
- [x] Tab min role `related`
- [x] Horse Planning is **display** of events + owner-created **own** events if the product still allows that (`H-PLAN-02`)
- [x] Stop using horse `POST …/planning` as stable ops (care, feed, stable whiteboard). That belongs on the entity when ops exist
- [x] Do **not** build stable whiteboard/health/feed APIs here (greenfield stable ops)
- [x] Do **not** add chat-reply on events (chat is greenfield)
- [x] No Medical/Feed horse tabs resurrected
- [x] Copy/UI must not tell the owner they run the yard from this tab

**Out of scope:** Implementing the stable ops module. Chat attached to events. Good-standing write-lock until Block 26 exists; if a guard helper is needed, Block 26 owns billing.

**Tests:** `npm test -- lib/services/__tests__/horsePlanningService.test.ts` (4 passed).  
**Real flow:** Related+ viewers see calendar per L2; owner team creates personal events (appointment/competition/training/other) via simplified form; no provider picker or entity-sourced POST; legacy entity/feeding events still display read-only if present in DB.

**Findings:**

- **Stable ops removed from write path:** Dropped `feeding` from create enum; removed `sourceEntityType` / `sourceEntityId` from form + API schema; `createPlanningItem` no longer sets entity source fields; new events default `visibilityMode: "public"`.
- **UI:** `horse-planning-event-form.tsx` rewritten — owner personal events only; no provider/entity linking.
- **Copy:** `en.json` / `es.json` planning description + metadata updated to personal-schedule wording (not yard ops).
- **Service gate:** `createPlanningItem` requires owner team (`userOwnsEntity`); non-owners get 403.
- **Read path unchanged:** `listPlanning` still returns legacy entity-linked / feeding events for display; `listProviderPlanning` exists but unused (entity aggregation greenfield — H-PLAN-01).
- **Eng. doc:** `horses.md` Shipped row clarifies POST is owner personal events only; Target drift note updated.

**Done when:** Existing Planning tab matches current horse-as-display rules. Stable ops not invented. ✅

---

### Block 15: Horse Admin and History

**Review:** done  
**Verdict:** polished  
**Date:** 2026-08-17

**Docs (only these):**
- `equus/docs/engineering/horseTabs.md`
- `equus/docs/engineering/page-flow-blueprint.md` (Admin tables / parent-owned Save)

**Also open if needed:** `equus/docs/engineering/ownershipTransfer.md` (Admin entry points only)

**Code roots:** `equus/app/[locale]/horses/[horseId]/admin/`, `equus/app/[locale]/horses/[horseId]/history/`, `equus/components/horses/admin/`, `equus/lib/services/horseAuditService.ts`

**Test migration (this block):**

| From (mirror) | To (`__tests__/`) | Status |
|---------------|---------------------|--------|
| (new) | `lib/services/__tests__/horseAuditService.test.ts` | done (created) |

**Check:**
- [x] Admin = `main_owner`; History = `responsible`
- [x] Admin: visibility, sale fields, ownership actions (immediate, not Save-batched)
- [x] History is **audit log**, not a second calendar
- [x] Tables use `components/table` (Admin History is visual source of truth)
- [x] Invite-from-Admin must not be a people-directory (flag `/users/search` for Block 21)

**Out of scope:** Waiting-transfer claim UX; payer side effects (Block 16 / 26).

**Tests:** `npm test -- lib/services/__tests__/horseAuditService.test.ts lib/services/__tests__/horseHubSections.test.ts` (20 passed).  
**Real flow:** Main owner opens Admin (`requireMainOwner`); visibility/sale batched via parent Save; change-owner / co-owner / responsible invites and removes fire immediately via OwnershipTransfer; responsible+ viewers open History audit table; guests and related viewers blocked from both tabs.

**Findings:**

- **Tab roles:** `TAB_MIN_ROLE` + `deriveAllowedTabs` match `horseTabs.md`; `HorsePageShell` gates Admin (`requireMainOwner`) and History (`requireOwnership` / owner team).
- **Save vs immediate:** `admin/client.tsx` parent-owned Save for visibility + sale/value; ownership transfer dialogs and role invite/remove sections act immediately (no Save batch).
- **History:** `HorseHistoryAuditSection` uses `DataTable` with fixed column order; copy describes audit log, not calendar.
- **Audit API:** `listAuditLogs` owner-team gate via `userOwnsEntity` (includes responsibles); `recordAudit` resolves `sourceType` from horse roster/relationships.
- **Admin roster UI:** Co-owner/responsible sections use EntityChip lists (not DataTable); acceptable — History table is the table visual SoT per blueprint.

**Done when:** Roles, Save vs immediate actions, and History-as-audit match docs. ✅

---

## Phase D — Graph and inboxes

### Block 16: Ownership transfer

**Review:** done  
**Verdict:** polished  
**Date:** 2026-08-17

**Docs (only these):**
- `equus/docs/engineering/ownershipTransfer.md`
- `equus/docs/features/ownershipTransfer.md`

**Code roots:** `equus/models/OwnershipTransfer.ts`, `equus/lib/services/ownershipTransferService.ts`, `equus/app/api/v1/ownership-transfers/`, `equus/app/[locale]/ownership-transfers/`, `equus/lib/horses/horseSubscriptionBilling.ts`

**Test migration (this block):**

| From (mirror) | To (`__tests__/`) | Status |
|---------------|---------------------|--------|
| `tests/lib/services/ownershipTransferService*.test.ts` | `lib/services/__tests__/ownershipTransferService*.test.ts` | done |
| `tests/models/ownershipTransfer.test.ts` | `models/__tests__/ownershipTransfer.test.ts` | done |
| `tests/lib/validations/ownershipTransfer.test.ts` | `lib/validations/__tests__/ownershipTransfer.test.ts` | done |
| `tests/lib/api/authClient.ownershipTransfers.test.ts` | `lib/api/auth/__tests__/authClient.ownershipTransfers.test.ts` | done |
| `tests/components/invites/ownership-transfers-content.test.ts` | `components/invites/__tests__/ownership-transfers-content.test.ts` | done |

**Check:**
- [x] Kinds: `transfer_main`, co-owner add/remove/promote, responsible add/remove
- [x] Duplicate pending → 409; email invite; cancel by initiator
- [x] Inbox `/ownership-transfers`
- [x] **Stop assigning** `Horse.subscription.payerUserId` (and any horse Equus-payer) on `transfer_main` accept — delete or stop that side effect. Horses are free; payer is the paid entity (Block 26)
- [x] Not used for user-linked service profiles

**Out of scope:** Waiting-transfer flag + daily nag (greenfield). Entity Stripe cutover (Block 26) — this block only removes horse-payer side effects.

**Tests:** `npm test -- lib/services/__tests__/ownershipTransferService models/__tests__/ownershipTransfer lib/validations/__tests__/ownershipTransfer lib/api/auth/__tests__/authClient.ownershipTransfers components/invites/__tests__/ownership-transfers-content app/api/v1/ownership-transfers/__tests__` (56 passed).  
**Real flow:** Main owner initiates transfer/co-owner/responsible flows; receiver accepts/declines; initiator cancels; inbox at `/ownership-transfers`. After `transfer_main` accept, `mainOwnerUserId` updates but `registration.payerUserId` stays unchanged.

**Findings:**

- **Payer side effect removed:** Dropped `reassignHorseSubscriptionPayerAfterTransferMain` call from `applyEntityOwnershipChange`; deleted the reassign helper from `horseSubscriptionBilling.ts`.
- **Consent flows:** All five transfer kinds, duplicate-pending 409, email invite with rollback on send failure, cancel by initiator — unchanged and tested.
- **Inbox:** `/ownership-transfers` + `GET /users/me/ownership-transfers` aligned with other inboxes.
- **Deferred Block 26:** `guardAcceptTransfer` on `transfer_main` accept, `createHorse` setting `registration.payerUserId`, deprecated `assignInitialHorseSubscriptionPayer` — owner-tier cleanup remains in billing block.
- **Eng. doc:** `ownershipTransfer.md` status → aligned; Shipped note updated (no payer move on horse transfer).

**Done when:** Consent flows work. Horse Equus-payer side effect is gone. ✅

---

### Block 17: Pedigree connections (API + inbox)

**Review:** done  
**Verdict:** polished  
**Date:** 2026-08-17

**Docs (only these):**
- `equus/docs/engineering/pedigreeConnections.md`

**Code roots:** `equus/models/PedigreeConnection.ts`, `equus/lib/services/pedigreeConnectionService.ts`, `equus/app/api/v1/pedigree-connections/`, `equus/app/[locale]/pedigree-connections/`, `equus/lib/utils/horseIdentity.ts`

**Test migration (this block):**

| From (mirror) | To (`__tests__/`) | Status |
|---------------|---------------------|--------|
| `tests/lib/services/pedigreeConnectionService.test.ts` | `lib/services/__tests__/pedigreeConnectionService.test.ts` | done (expanded) |
| `tests/components/invites/pedigree-connections-content.test.ts` | `components/invites/__tests__/pedigree-connections-content.test.ts` | done |
| `tests/lib/email/pedigreeAndOwnershipInvite.test.ts` | `lib/email/__tests__/pedigreeAndOwnershipInvite.test.ts` | done |

**Check:**
- [x] Child main owner initiates; never changes ownership
- [x] Accept with `parentHorseId` vs stub parent
- [x] Email failure rolls back pending doc
- [x] Inbox page pattern matches other inboxes

**Out of scope:** Import from HorseTelex.

**Tests:** `npm test -- lib/services/__tests__/pedigreeConnectionService components/invites/__tests__/pedigree-connections-content lib/email/__tests__/pedigreeAndOwnershipInvite` (10 passed).  
**Real flow:** Child main owner requests sire/dam link (existing parent horse or email invite); parent owner accepts/declines at `/pedigree-connections`; initiator can cancel; accept writes child `pedigree.sire*|dam*` only.

**Findings:**

- **Aligned:** Service gates create to child `mainOwnerUserId`; accept with `parentHorseId` requires parent main owner; stub path creates parent owned by accepter; ownership on both horses unchanged.
- **Email rollback:** `createPedigreeConnection` deletes pending doc on `sendPedigreeConnectInviteEmail` failure — now covered by test.
- **Inbox:** `/pedigree-connections` mirrors ownership-transfers pattern (`AuthPageShell`, highlight query param, Accept/Decline, sign-in redirect, `SectionErrorBoundary`).
- **Identity:** Stub parents created without microchip/registry (owner fills later); `horseIdentity.ts` used elsewhere for uniqueness — no drift in this block.
- **Eng. doc:** `pedigreeConnections.md` already **aligned** — no doc edits required.

**Done when:** Consent pedigree links match engineering. ✅

---

### Block 18: Workplace

**Review:** done  
**Verdict:** polished  
**Date:** 2026-08-17

**Docs (only these):**
- `equus/docs/engineering/workplace.md`
- `equus/docs/features/workplaceRelationship.md`

**Code roots:** `equus/models/WorkplaceRelationship.ts`, `equus/lib/services/workplaceRelationshipService.ts`, `equus/app/api/v1/role-profiles/`, `equus/app/api/v1/users/me/workplaces/`, `equus/app/[locale]/workplaces/`, `equus/app/[locale]/user/[userId]/workplace/`

**Test migration (this block):**

| From (mirror) | To (`__tests__/`) | Status |
|---------------|---------------------|--------|
| `tests/lib/services/workplaceRelationshipService.test.ts` | `lib/services/__tests__/workplaceRelationshipService.test.ts` | done (expanded) |
| `tests/models/workplaceRelationship.test.ts` | `models/__tests__/workplaceRelationship.test.ts` | done |
| `tests/lib/validations/workplaceRelationship.test.ts` | `lib/validations/__tests__/workplaceRelationship.test.ts` | done |
| `tests/lib/auth/workplaceRelationshipPermissions.test.ts` | `lib/auth/__tests__/workplaceRelationshipPermissions.test.ts` | done |
| `tests/components/user/workplace/user-workplace.test.ts` | `components/user/workplace/__tests__/user-workplace.test.ts` | done |

**Check:**
- [x] Host invites Users (or email); hierarchy admin/manager/staff
- [x] Collaborators do not become `mainOwnerUserId`
- [x] Accept/decline invitations
- [x] Dual-gate documented: stable ops need horse↔stable `Relationship` **and** workplace (ops themselves are not built)
- [x] Launch paid host is **stable**; other hosts exist in code as later modules

**Out of scope:** Building stable ops (roster/whiteboard). Entity billing/good-standing helpers are Block 26.

**Tests:** `npm test -- lib/services/__tests__/workplaceRelationshipService models/__tests__/workplaceRelationship lib/validations/__tests__/workplaceRelationship lib/auth/__tests__/workplaceRelationshipPermissions components/user/workplace/__tests__/user-workplace` (32 passed).  
**Real flow:** Stable owner invites user by email; invitee accepts/declines; owner lists collaborators and ends collaboration; `/user/[userId]/workplace` lists owned + collaborator workplaces.

**Findings:**

- **Aligned:** `inviteCollaborator` / accept / decline / `endCollaboration` match `workplace.md`; hierarchy levels `admin` | `manager` | `staff`; email invite with rollback on send failure (now tested).
- **Ownership boundary:** Accept adds `WorkplaceRelationship` + host `collaborators[]` index — never sets `mainOwnerUserId` on host or invitee (tested).
- **Dual-gate:** `canCollaboratorActOnHorse` requires active workplace **and** accepted horse↔stable `Relationship` — tested in service suite; documented in engineering + features docs.
- **Host types:** Code supports stable, breeder, transport, ridingClub; product launch host is stable — other types listed as owner workplaces only, no product drift.
- **UI:** `/workplaces` (invitations inbox) + `/user/[userId]/workplace` (owned + pending workplaces) follow inbox/shell conventions.
- **Eng. doc:** `workplace.md` already **aligned** — no doc edits required.

**Done when:** Collab invite lifecycle matches workplace.md. ✅

---

### Block 19: Notifications

**Review:** done  
**Verdict:** polished  
**Date:** 2026-08-17

**Docs (only these):**
- `equus/docs/engineering/userTabs.md` (Notifications tab = email opt-ins)
- `equus/docs/engineering/page-flow-blueprint.md`

**Code roots:** `equus/app/api/v1/notifications/`, `equus/lib/services/notificationService.ts`, `equus/app/[locale]/notifications/`, `equus/app/[locale]/user/[userId]/notifications/`, `equus/components/notifications/`, `equus/models/Notification.ts`

**Test migration (this block):**

| From (mirror) | To (`__tests__/`) | Status |
|---------------|---------------------|--------|
| `tests/lib/services/notificationService.test.ts` | `lib/services/__tests__/notificationService.test.ts` | done |
| `tests/components/notifications/notifications-content.test.ts` | `components/notifications/__tests__/notifications-content.test.ts` | done |
| `tests/components/user/notifications/user-notification-email-section.test.ts` | `components/user/notifications/__tests__/user-notification-email-section.test.ts` | done |

**Check:**
- [x] In-app list + mark-read for authenticated user
- [x] Account tab email opt-ins vs `/notifications` inbox are distinct and correctly labeled
- [x] Preference keys exist without implying chat/messages are built
- [x] Page follows inbox/shell conventions

**Out of scope:** Push; waiting-transfer nags; chat message notifications.

**Tests:** `npm test -- lib/services/__tests__/notificationService components/notifications/__tests__/notifications-content components/user/notifications/__tests__/user-notification-email-section app/api/v1/notifications/__tests__/route.test.ts` (16 passed).  
**Real flow:** Deletion/media services emit in-app notifications; user opens `/notifications`, marks read; account tab toggles email opt-ins independently.

**Findings:**

- **In-app inbox:** `listNotifications` / `markNotificationAsRead` + `GET/PATCH /api/v1/notifications` — paginated, `readByUserIds`, tombstone-aware; UI refactored to `AuthPageShell` + home link (matches other inboxes).
- **Distinct surfaces:** `/notifications` = in-app inbox (`notifications.description`); `/user/[userId]/notifications` = email opt-ins only (`userNotifications.title` → "Email notifications", description clarifies no inbox here).
- **Messages preference:** Key retained for future chat; copy updated to "when that feature is available" (en/es) — does not imply DMs are shipped.
- **Shipped types:** `notificationTypeEnums` includes deletion-request types + relationship/system; no chat push wiring.
- **Eng. docs:** `userTabs.md` already documents tab = email opt-ins; no doc drift.

**Done when:** In-app + email-preference surfaces match what is shipped, not the full mvpScope notification list. ✅

---

### Block 20: Home / My Graph

**Review:** done  
**Verdict:** polished  
**Date:** 2026-08-17

**Docs (only these):**
- `equus/docs/engineering/myGraph.md` (**Shipped** then **Target**)
- `equus/docs/features/myGraph.md`

**Code roots:** `equus/app/[locale]/home/`, `equus/components/home/`, `equus/lib/navigation/postAuthRedirect.ts`

**Test migration (this block):**

| From (mirror) | To (`__tests__/`) | Status |
|---------------|---------------------|--------|
| `tests/components/home/home-page.test.ts` | `components/home/__tests__/home-page.test.ts` | done (rewritten) |

**Check:**
- [x] `/home` is post-login landing
- [x] Unauthenticated → sign-in
- [x] Rebuild `/home` to the **current** My Graph contract: an **action inbox**, not a roster
- [x] Show pending horse↔provider `Relationship` invites (API already exists)
- [x] Show pending `WorkplaceRelationship` invites (API already exists)
- [x] Deep-link rows to Connect / ownership-transfer / horse as docs specify
- [x] Empty copy points to Horse and Stable **modules** (lists default mine)
- [x] Remove “all my horses / all my stables / create hub” as the home body
- [x] Do **not** add last-used-module as home
- [x] Do **not** dump a favorites catalog (favorites are greenfield)
- [x] Waiting-transfer nag rows: omit until that flag exists (`partial` is OK for that slice only)

**Out of scope:** Building waiting-transfer. Building favorites. Chat.

**Tests:** `npm test -- components/home/__tests__/home-page components/home/__tests__/home-guest-components` (10 passed).  
**Real flow:** Login → `/home`; pending relationship/workplace invites with accept/decline; Connect deep link; empty inbox → horses/stables modules; no owned-entity roster.

**Findings:**

- **Rebuilt home body:** Replaced add-horse card + owned subsection grid with `HomeActionInbox` (pending relationships + workplace invites only).
- **Removed dead UI:** Deleted `home-user-add-horse-card.tsx` and `home-user-subsection-card.tsx`; dropped `useUserNavigation` from home client.
- **Deep links:** Relationship rows link to `/horses/:id/connect`; workplace rows link to user workplace tab; section headers link to `/relationships` and `/workplaces`.
- **Waiting-transfer:** Omitted — no horse flag in codebase (documented as partial in features).
- **Eng. docs:** `myGraph.md` status → aligned; feature IDs MG-02/03 done, MG-01 partial.

**Done when:** `/home` is an action inbox for existing invite types. Roster-as-home is gone. ✅

---

## Phase E — User surface and other entities

### Block 21: User hub, public view, people-search

**Review:** done  
**Verdict:** polished  
**Date:** 2026-08-17

**Docs (only these):**
- `equus/docs/engineering/users.md`
- `equus/docs/conventions/visibility.md`

**Also open if needed:** `equus/docs/features/userModule.md` (discovery / no people search)

**Code roots:** `equus/app/api/v1/users/`, `equus/lib/privacy/userPublicProfile.ts`, `equus/lib/users/userHubSections.ts`, `equus/app/[locale]/users/[userId]/`, `equus/app/[locale]/user/[userId]/page.tsx`

**Check:**
- [x] Public `/users/[userId]` vs self `/user/[userId]`
- [x] L1 user `profileVisibility`; deny → 404
- [x] L2 hub section modes
- [x] `GET /users/search` must **not** be a people directory. Ownership/provider invites: email and/or entity-linked identity (existing invite feature — change the picker, create files if needed)
- [x] Remove people search from any nav/UI that treats Users as a searchable module
- [x] Never favorite Users (favorites are greenfield)

**Out of scope:** Building a public people-discovery product. Favorites.

**Tests:** `npm test -- lib/privacy/__tests__ lib/users/__tests__/userHubSections.test.ts components/user/hub/__tests__/userHubContent.test.ts components/horses/admin/__tests__/horse-admin-invite-dialogs.test.ts`  
**Real flow:** Public user page as guest; owner view; horse Admin/Connect invite works without a user directory; no global people search.

**Findings:**

- **Hub/view/privacy:** Already matched docs — L1/L2 enforced in `userPublicProfile.ts`; public `/users/[userId]` vs self `/user/[userId]` unchanged.
- **People search removed:** Deleted `GET /api/v1/users/search`, `useUserSearch`, `UserInviteSection`, and `searchUsers()` from `userService`.
- **Admin invites:** `HorseAdminRoleInviteDialog` and `HorseOwnershipChangeDialog` now use `EmailInviteSection` (email-only); server resolves existing users from `invitedEmail` via ownership transfer service.
- **Connect:** Already on `ProviderInvitePicker` → `/discover/providers` (Block 11).
- **Favorites:** No `User.favorites` field or API — greenfield only.

**Done when:** Hub/view/privacy match docs. Invite path no longer depends on people search as a module. ✅

---

### Block 22: User account tabs

**Review:** done  
**Verdict:** polished  
**Date:** 2026-08-17

**Docs (only these):**
- `equus/docs/engineering/userTabs.md`

**Code roots:** `equus/lib/navigation/userTabs.ts`, `equus/app/[locale]/user/[userId]/`, `equus/components/user/`

**Check:**
- [x] Self-only tabs: Hub, Profile, Preferences, Notifications, Workplace, Relationships
- [x] `UserPageShell` is auth + self only
- [x] **Remove** the User Subscription tab (owner-tier horse billing). Payer UI belongs on the paid entity (Block 26 may add Stable billing; this block must not keep horse-count plans on the account)
- [x] Chrome = `UserLayoutChrome` + `EntityTabs`

**Out of scope:** Designing the full Stripe catalog UI (Block 26). Chat/favorites tabs. Global `/subscription` route (Block 26).

**Tests:** `npm test -- lib/navigation/__tests__/userTabs.test.ts components/user/__tests__/user-page-shell.test.ts`  
**Real flow:** Open each self tab; another user’s `/user/:id` is forbidden; no horse-tier subscription screen on the account.

**Findings:**

- **Tabs:** `getUserTabs` now returns six tabs; subscription path helper and tab entry removed.
- **Route removed:** Deleted `/user/[userId]/subscription` page, client, loading, and `UserSubscriptionPlanSection`.
- **Chrome:** `UserLayoutChrome` no longer passes a subscription label.
- **Gate:** `UserPageShell` unchanged — auth + self only.

**Done when:** Account chrome matches current docs. Horse-count Subscription tab is gone. ✅

---

### Block 23: Stable (shipped profile only)

**Review:** done  
**Verdict:** polished  
**Date:** 2026-08-17

**Docs (only these):**
- `equus/docs/engineering/stables.md` (**Shipped** first)
- `equus/docs/features/stableModule.md` (principles + section 1 only)

**Code roots:** `equus/app/api/v1/stables/`, `equus/lib/services/stableService.ts`, `equus/models/Stable.ts`, `equus/app/[locale]/stables/`, `equus/components/stable/`

**Check:**
- [x] List/create/get/patch/discovery only
- [x] `isPublic: false` visibility rules (owner, workplace, accepted horse relationship)
- [x] Contact on Stable, not `User.preferences`
- [x] Tabs Hub / Profile / Admin as shipped — **no** roster, stalls, whiteboard, finance
- [x] Workplace wired for this host type

**Out of scope:** Building roster, stalls, whiteboard, health, feed, docs-as-ops, finance, facilities (greenfield stable SaaS). Entity **billing** for this existing Stable module is Block 26, not skipped.

**Tests:** `npm test -- lib/services/__tests__/stableService.test.ts lib/stables/__tests__/stableDiscoveryAccess.test.ts lib/navigation/__tests__/stableTabs.test.ts components/stable/__tests__/stable.test.ts app/api/v1/stables/[id]/__tests__/route.get.test.ts`  
**Real flow:** Create stable; public Hub; private 404 for stranger; owner Profile/Admin; discovery PATCH.

**Findings:**

- **REST:** Five shipped endpoints only — no ops routes under `/stables`.
- **Discovery:** `getStableView` + `canViewStableDiscovery` enforce owner / public / relationship / workplace collaboration; private stables 404 for strangers.
- **Contact:** Hub and Profile use `Stable.email` / `phoneNumber` / `websiteUrl` — not `User.preferences`.
- **Tabs:** `getStableTabs` → Hub, Profile, Admin; Admin gated to main owner; Profile to owner team.
- **Workplace:** `hostRoleType: "stable"` on `WorkplaceRelationship`; API at `/role-profiles/stable/:id/workplace-relationships`.
- **Target ops:** Not built (greenfield) — model fields like `stallCapacity` exist but have no write UI/API yet.

**Done when:** Existing stable profile/discovery/tabs match current docs. Ops module not invented. ✅

---

### Block 24: Later modules — entity-owned

**Review:** done  
**Verdict:** aligned  
**Date:** 2026-08-17

**Docs (only these):**
- `equus/docs/engineering/later-modules.md`
- `equus/docs/conventions/ui-layout-naming.md`

**Types:** breeder · transport · riding club

**Code roots:** `equus/app/api/v1/{breeders,transports,riding-clubs}/`, matching services, `equus/app/[locale]/{breeders,transport,riding-clubs}/`, `equus/components/{breeder,transport,riding-club}/`

**Test migration (this block):**

| From (mirror) | To (`__tests__/`) | Status |
|---------------|---------------------|--------|
| `tests/lib/services/breederService.test.ts` | `lib/services/__tests__/breederService.test.ts` | done |
| `tests/lib/services/transportService.test.ts` | `lib/services/__tests__/transportService.test.ts` | done |
| `tests/lib/services/ridingClubService.test.ts` | `lib/services/__tests__/ridingClubService.test.ts` | done |
| `tests/lib/breeders/breederDiscoveryAccess.test.ts` | `lib/breeders/__tests__/breederDiscoveryAccess.test.ts` | done |
| `tests/lib/transports/transportDiscoveryAccess.test.ts` | `lib/transports/__tests__/transportDiscoveryAccess.test.ts` | done |
| `tests/components/breeder/breeder.test.ts` | `components/breeder/__tests__/breeder.test.ts` | done |
| `tests/components/transport/transport.test.ts` | `components/transport/__tests__/transport.test.ts` | done |
| `tests/components/riding-club/riding-club.test.ts` | `components/riding-club/__tests__/riding-club.test.ts` | done |
| GET `:id` route tests | already colocated per type | n/a |

**Per type:**

| Type | CRUD/view | Discovery | Hub/Profile/Admin | Workplace host | Notes |
|------|-----------|-----------|-------------------|----------------|-------|
| breeder | [x] | [x] | [x] | [x] | `hostRoleType: "breeder"` |
| transport | [x] | [x] | [x] | [x] | `hostRoleType: "transport"` |
| riding club | [x] | [x] | [x] | [x] | `hostRoleType: "ridingClub"` |

**Check:**
- [x] Same view contract as stables (`viewerRole`, `allowedTabs`)
- [x] `mainOwnerUserId` / `coOwners[]`
- [x] Deny → 404
- [x] Not treated as launch paid SaaS
- [x] Shared pattern matches Block 2; do not invent a new architecture

**Out of scope:** Turning these into paid ops modules.

**Tests:** `npm test -- lib/services/__tests__/breederService.test.ts lib/services/__tests__/transportService.test.ts lib/services/__tests__/ridingClubService.test.ts lib/breeders/__tests__/ lib/transports/__tests__/ components/breeder/__tests__/ components/transport/__tests__/ components/riding-club/__tests__/ app/api/v1/breeders app/api/v1/transports app/api/v1/riding-clubs` (52 passed).  
**Real flow:** Code-traced create/list/get/patch/discovery for all three; guest Hub on public entities; owner Admin gated to main owner; private entities 404 for strangers; contact on entity profile not User.preferences.

**Findings:**

- **REST aligned:** Each type has `POST`, `GET /:id` → `{ viewerRole, allowedTabs, <entity> }`, `PATCH /:id/discovery`; deny → 404 via discovery access helpers.
- **Ownership:** `mainOwnerUserId` + `coOwners[]` on all three models; Admin tab main-owner only; Profile owner team.
- **Tabs/UI:** Hub / Profile / Admin pattern matches stable (Block 2/23); thin `page.tsx` + `client.tsx` + `loading.tsx` + layout chrome.
- **Workplace:** All three are valid `hostRoleType` values; `/role-profiles/<type>/:id/workplace-relationships` routes exist.
- **Not launch SaaS:** No ops/billing routes beyond profile CRUD + discovery.
- **Test colocation:** Eight mirror suites moved; route GET tests already colocated.
- **Senior engineer:** No `useRef` or unjustified imperative DOM in block code roots.

**Done when:** All three match later-modules.md. ✅

---

### Block 25: Later modules — user-linked

**Review:** done  
**Verdict:** aligned  
**Date:** 2026-08-17

**Docs (only these):**
- `equus/docs/engineering/later-modules.md`

**Types:** trainer · groom · veterinary · farrier · coach · rider

**Code roots:** `equus/app/api/v1/{trainers,grooms,veterinaries,farriers,coaches,riders}/`, matching services, `equus/app/[locale]/{trainers,groomers,veterinaries,farriers,coaches,riders}/`

**Test migration (this block):**

| From (mirror) | To (`__tests__/`) | Status |
|---------------|---------------------|--------|
| `tests/lib/services/*Service.test.ts` (6 types) | `lib/services/__tests__/` | done |
| `tests/lib/{trainers,grooms,...}/*DiscoveryAccess.test.ts` | `lib/{type}/__tests__/` | done |
| `tests/components/{trainer,groom,...}/*.test.ts` | `components/{type}/__tests__/` | done |
| GET `:id` route tests | already colocated per type | n/a |

**Per type:**

| Type | CRUD/view | Discovery | Hub/Profile (no Admin) | `userId` + User.*ProfileId | Second POST → 409 | Notes |
|------|-----------|-----------|------------------------|----------------------------|-------------------|-------|
| trainer | [x] | [x] | [x] | [x] | [x] | `viewerRole: owner`; tabs Hub + Profile |
| groom | [x] | [x] | [x] | [x] | [x] | |
| veterinary | [x] | [x] | [x] | [x] | [x] | not in launch billing gate |
| farrier | [x] | [x] | [x] | [x] | [x] | |
| coach | [x] | [x] | [x] | [x] | [x] | |
| rider | [x] | [x] | [x] | [x] | [x] | |

**Check:**
- [x] No `coOwners[]` / host workplace on these types
- [x] Veterinary is **not** in the production launch gate (no special billing)
- [x] `viewerRole: owner` (not `main_owner`) and tabs Hub + Profile only

**Out of scope:** Vet/trainer paid SaaS.

**Tests:** `npm test -- lib/services/__tests__/trainerService.test.ts … riderService.test.ts lib/{trainers,grooms,veterinaries,farriers,coaches,riders}/__tests__ components/{trainer,groom,veterinary,farrier,coach,rider}/__tests__ app/api/v1/{trainers,grooms,veterinaries,farriers,coaches,riders}` (108 passed).  
**Real flow:** Code-traced claim profile via POST; second POST → 409; guest Hub on public profiles; no Admin tab.

**Findings:**

- **REST aligned:** All six types match user-linked rules in `later-modules.md`; GET returns `{ viewerRole: "owner", allowedTabs: ["hub","profile"], <entity> }`.
- **409 on duplicate:** Each service rejects second profile for same user.
- **No host workplace:** User-linked types are not `hostRoleType` workplace hosts.
- **Veterinary:** No special billing or launch gate in code.
- **Test colocation:** Eighteen mirror suites moved; route GET tests already colocated.
- **Senior engineer:** No `useRef` or unjustified imperative DOM in block code roots.

**Done when:** All six match later-modules.md user-linked rules. ✅

---

## Phase F — Money, chrome leftovers, greenfield list

### Block 26: Billing → entity subscription

**Review:** done  
**Verdict:** polished  
**Date:** 2026-08-17

Monetization **already exists** in code (Stripe, plans, guards, User subscription UI). Product re-thought it: horses are free; the **paid entity** (Stable at launch) is the customer. This block **replaces** the old implementation.

**Docs (only these):**
- `equus/docs/engineering/billing.md` (Shipped = dead owner-tier; **implement Target**)
- `equus/docs/features/entitySubscription.md`
- `equus/docs/product/monetization.md` (who pays, states, meter, lapse — do not copy euro tables into engineering docs)

**Code roots:** `equus/lib/billing/`, `equus/app/api/v1/billing/`, `equus/models/Stable.ts`, stable Admin UI

**Test migration (this block):**

| From (mirror) | To (`__tests__/`) | Status |
|---------------|---------------------|--------|
| `tests/lib/horses/horseSubscriptionBilling.test.ts` | deleted (dead owner-tier) | done |
| `tests/components/billing/subscription-page-content.test.ts` | deleted (global UI removed) | done |
| `tests/hooks/queries/useBilling.test.ts` | `hooks/queries/__tests__/useBilling.test.ts` | done (rewritten) |
| (new) | `lib/billing/__tests__/entitySubscription.test.ts` | done |
| (new) | `lib/billing/__tests__/entityCatalog.test.ts` | done |
| (new) | `lib/services/__tests__/stableEntitySubscription.test.ts` | done |

**Check:**
- [x] Delete or stop owner-pays horse-count tiers
- [x] Horses stay unlimited and free; `POST /horses` has no Equus paywall
- [x] Stripe customer + subscription **on the entity**; replace user-tier checkout/portal/webhook/current
- [x] Store catalog/good-standing fields on Stable `subscription`
- [x] New stable gets **30-day free** trialing window
- [x] Guards gate stable profile/discovery PATCH via `assertStableWriteAllowed`
- [x] Meter helper counts active horse↔stable `Relationship` rows
- [x] Do not wire `payerUserId` or `dataAvailability: payment_blocked`
- [x] Payer/portal UI on Stable Admin; `/subscription` redirects to `/home`
- [x] Update `billing.md` Shipped

**Tests:** `npm test -- lib/billing/__tests__ lib/services/__tests__/stableEntitySubscription.test.ts lib/services/__tests__/horseService.test.ts lib/services/__tests__/ownershipTransferService hooks/queries/__tests__/useBilling.test.ts` (67 passed).  
**Real flow:** Free user creates multiple horses; stable create starts trialing; Stable Admin billing section; no transfer-accept cap.

**Findings:**

- **Replaced owner-tier:** Deleted `plans.ts`, `horseCounter.ts`, `subscriptionGuard.ts`, `paymentGate.ts`, `horseSubscriptionBilling.ts`, global subscription UI.
- **Entity subscription:** `Stable.subscription`, `entityCatalog.ts`, `rosterMeter.ts`, `entityWriteGuard.ts`, entity-scoped Stripe routes.
- **UI:** `StableBillingSection` + `useEntityBilling` hooks.
- **Horses:** Removed `payerUserId` on create; removed `guardAcceptTransfer`.
- **Eng. doc:** `billing.md` → **aligned**.

**Done when:** Owner-tier horse billing gone; entity subscription matches monetization docs for Stable. ✅

---

### Block 27: Theme tokens

**Review:** done  
**Verdict:** aligned  
**Date:** 2026-08-17

**Docs (only these):**
- `equus/docs/engineering/theme-default-palette.md`
- `equus/docs/conventions/ui-styling.md`

**Code roots:** `equus/app/globals.css`, `equus/lib/theme/`

**Test migration (this block):**

| From (mirror) | To (`__tests__/`) | Status |
|---------------|---------------------|--------|
| `tests/theme/appTheme.test.ts` | `lib/theme/__tests__/appTheme.test.ts` | done |
| `tests/theme/colorCentralization.test.ts` | **keep** in `tests/theme/` (cross-cutting harness) | n/a |
| `tests/theme/nonCssColorsSync.test.ts` | **keep** in `tests/theme/` (cross-cutting harness) | n/a |

**Check:**
- [x] Default palette hex roles match the brief
- [x] Semantic tokens, not ad-hoc hex in components (sample horse + auth)
- [x] Guest = default theme; signed-in uses `preferredTheme` + cookie
- [x] `theme-onyx` exists without breaking default

**Out of scope:** New themes.

**Tests:** `npm test -- lib/theme/__tests__/appTheme.test.ts tests/theme` (24 passed).  
**Real flow:** `:root` tokens match palette doc; auth + horse Hub use semantic Tailwind classes only; preferences theme picker uses `themeSwatches` from `appTheme.ts`.

**Findings:**

- **Palette aligned:** `globals.css` `:root` matches `theme-default-palette.md` hex roles; `.theme-onyx` block present.
- **Centralization:** `nonCssColors.ts` synced with `:root`; color audit passes on auth + hub samples.
- **Polished — test mock:** `preferences-form.test.ts` uses `importOriginal` for `appTheme` to avoid hex literals in component tests.
- **Senior engineer:** `applyThemeToDocument` / `syncThemeCookie` — justified `<html>` class + cookie (documented in Block 4/5 retro).

**Done when:** Tokens match the palette brief. ✅

---

### Block 28: Greenfield inventory (not built)

**Review:** done  
**Verdict:** aligned  
**Date:** 2026-08-17

**Docs (only these):**
- `equus/docs/engineering/favorites.md`
- `equus/docs/engineering/chat.md`
- `equus/docs/engineering/stables.md` (ops Target only)
- `equus/docs/engineering/i18n.md` (Target `pt`)
- `equus/docs/engineering/horses.md` (waiting-transfer only)

**Job:** Confirm these capabilities are still absent. Remove accidental stubs that would look like a shipped feature. **Do not build them.** Items that Block 20 / 21 / 26 already aligned must not appear here as “still wrong.”

| Item | Expected | Code check | Action |
|------|----------|------------|--------|
| Favorites | not built | [x] no `User.favorites` | none — absent |
| Chat | not built | [x] no `/api/v1/chat`; `Booking.chatThreadId` unused | none — documented unused |
| Waiting-transfer | not built | [x] no horse flag / daily nag | none — absent |
| Stable ops | not built | [x] no roster/whiteboard/finance APIs | none — absent |
| Portuguese | not built | [x] no `messages/pt.json` | none — absent |

**Done when:** Table filled. ✅

**Findings:**

- All five greenfield items confirmed absent; no contradictory stubs found.
- Prior align work (Blocks 20/21/26) preserved.

---

## Suggested next-feature order (after this review)

Not part of this review. Truly new capabilities:

1. Waiting-transfer + daily nag (stable creates boarded horse).
2. Favorites (list filter, never Users).
3. Chat (user-to-user).
4. Stable SaaS ops (roster, whiteboard, health, feed, finance, owner portal) using the entity subscription already aligned in Block 26.
5. Portuguese locale.
6. Entity-sourced Planning/Documents aggregation once stable ops can write.

---

## Prompt to execute the next pending block

```
Execute the next pending block in equus/docs/superpowers/plans/2026-08-17-shipped-work-review.md.

Follow that file’s global constraints and the align vs greenfield rule. Open only the docs listed on the block (plus `equus/docs/conventions/testing.md` for test placement). Apply [`agents/senior-engineer.md`](../../../agents/senior-engineer.md) to every file in the block’s code roots — React-first: no DOM `useRef`; no unjustified `document.*` / `window.*` manipulation.

**Test migration:** move every mirror test under `equus/tests/` that belongs to this block into colocated `__tests__/` next to the source; delete the mirror copy; then update, delete, or create tests only in `__tests__/`.

If the capability already exists and the docs were updated, change the source to match (delete, update, and create files/models as needed). Do not leave dead Shipped behavior in place.

If the capability has no implementation (chat, favorites, waiting-transfer, stable ops, Portuguese), do not build it.

When finished: run the listed tests and the real user flow, then update the block (status, verdict, date, findings including **Senior engineer** subsection, test migration table, checkboxes) and the progress table.
```
