# Guest/Landing Area Refactoring — Design Document

**Date:** 2026-08-02
**Status:** ✅ DONE (executed 2026-08-02 — all 19 tasks complete; 688 tests pass, lint clean)
**Scope:** Comprehensive refactoring of the guest landing (`/`) and signed-in home (`/home`) areas to match the canonical patterns established by the horse module and documented in `page-flow-blueprint.md`.

---

## 1. Directory & File Structure

### Current State

```
app/[locale]/
  page.tsx          ← Suspense wrapper, inline skeleton, imports HomePage directly
  (no loading.tsx)  ← MISSING

app/[locale]/home/
  page.tsx          ← dynamic() import pattern, inline skeleton
  loading.tsx       ← bare Skeleton (no named component)

components/home/
  home-page.tsx     ← Guest landing: auth check + guest panels (raw <section>)
  user-home-page.tsx← Signed-in home: auth + data fetch + panels (raw <section>)
```

### Target State

Mirrors `horses/[horseId]/` pattern: thin `page.tsx` → `generateMetadata` → `client.tsx` content assembly.

```
app/[locale]/
  page.tsx          ← thin SC: generateMetadata + render <GuestLandingContent />
  client.tsx        ← NEW: "use client": auth check, content assembly
  loading.tsx       ← NEW: HomePageContentSkeleton

app/[locale]/home/
  page.tsx          ← thin SC: generateMetadata + render <HomeContent />
  client.tsx        ← NEW: "use client": auth check, data fetch, content assembly
  loading.tsx       ← updated: HomePageContentSkeleton (same component)

components/home/
  home-page-content-skeleton.tsx   ← NEW: shared skeleton (Skeleton + Spinner, suppressHydrationWarning, showSpinner)
  home-welcome-hero.tsx            ← NEW: extracted guest hero variant
  home-guest-panel.tsx             ← NEW: extracted guest CTA panel
  home-user-welcome-hero.tsx       ← NEW: extracted user welcome hero with avatar
  home-user-add-horse-card.tsx     ← NEW: extracted horse CTA card
  home-user-subsection-card.tsx    ← NEW: extracted subsection grid card
  home-page.tsx                    ← DELETED (split into client.tsx + extracted components)
  user-home-page.tsx               ← DELETED (split into home/client.tsx + extracted components)
```

**Naming convention:** All home-specific component files use the `home-` filename prefix, mirroring the `horse-` rule. Export names match filenames (e.g. `HomePageContentSkeleton`, `HomeWelcomeHero`).

---

## 2. Component Architecture & Data Flow

### Guest landing (`/`)

```
layout.tsx (locale) → AppShell + AppProviders (always renders)
  └── loading.tsx → HomePageContentSkeleton (SSR streaming)
      └── page.tsx (SC) → generateMetadata + <GuestLandingContent />
          └── client.tsx → GuestLandingContent ("use client")
              ├── useAppAuth()
              ├── isLoading || isAuthenticated? → HomePageContentSkeleton (suppressHydrationWarning)
              ├── isAuthenticated? → useEffect redirect → /home
              └── guest state:
                  ├── SectionErrorBoundary → HomeWelcomeHero
                  └── SectionErrorBoundary → HomeGuestPanel (sign in / sign up CTAs)
```

### Signed-in home (`/home`)

```
layout.tsx (locale) → AppShell + AppProviders (always renders)
  └── loading.tsx → HomePageContentSkeleton (SSR streaming)
      └── page.tsx (SC) → generateMetadata + <HomeContent />
          └── client.tsx → HomeContent ("use client")
              ├── useAppAuth() + useUserProfile(isAuthenticated) + useUserNavigation(isAuthenticated)
              ├── isLoading? → HomePageContentSkeleton (suppressHydrationWarning)
              ├── not authenticated? → useEffect redirect → buildSignInPath()
              └── authenticated:
                  └── div (suppressHydrationWarning)
                      ├── SectionErrorBoundary → HomeUserWelcomeHero
                      ├── SectionErrorBoundary → HomeUserAddHorseCard (always shown)
                      └── SectionErrorBoundary → subsection grid (when links.length > 0)
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| `page.tsx` only does `generateMetadata` + one client render | Matches blueprint §3: "Only `generateMetadata` — no data fetching for content" |
| `client.tsx` owns all auth checks, redirects, loading states | Matches `HorsePageShell` pattern: auth/dataload in one client boundary |
| `loading.tsx` and inline loading use **same** `HomePageContentSkeleton` | Blueprint §4: "Same component = no visual swap when SSR transitions to client hydration" |
| `suppressHydrationWarning` on content container | component-resilience.md: cookie-auth → SSR skeleton → client data mismatch |
| No `dynamic()` imports | Horse module uses direct imports; consistency |
| No `<Suspense>` wrappers | AGENTS.md: "Do **not** wrap page content in `<Suspense>` for hydration mismatch mitigation" |
| Auth redirects are `useEffect` side effects | Never block render; skeleton shows during auth check |
| `Section` component replaces raw `<section>` | Blueprint §5.5: "Always use `<Section>` — never raw `<section>` elements" |
| Each data section in `SectionErrorBoundary` | Blueprint §7: header survives, children get `InlineErrorFallback` |

---

## 3. Skeleton Component

Single reusable `HomePageContentSkeleton` — mirrors `HorsePageContentSkeleton` exactly:

```tsx
// components/home/home-page-content-skeleton.tsx
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";

export function HomePageContentSkeleton({
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

**Usage:**
- `loading.tsx` (both routes) — default props (no suppress, spinner on)
- `client.tsx` auth loading — `suppressHydrationWarning` (prevents SSR hydration mismatch)
- `client.tsx` data loading — `suppressHydrationWarning`

---

## 4. Extracted Sub-Components

### `HomeWelcomeHero` (guest variant)
- Input: `title`, `subtitle` (translated strings)
- Decorated card with Equus brand, blur background accents
- No auth, no data fetch — pure presentational

### `HomeGuestPanel`
- Input: `title`, `description`, `signInLabel`, `signUpLabel`
- Card with icon, heading, and sign-in/sign-up buttons
- Links use `@/i18n/navigation` `Link`

### `HomeUserWelcomeHero` (user variant)
- Input: `title`, `subtitle`, `avatarUrl?`, `avatarLabel?`
- Decorated card with Equus brand + user avatar + display name
- No auth, no data fetch — pure presentational

### `HomeUserAddHorseCard`
- Input: `href`, `eyebrow`, `title`, `description`, `icon`
- Prominent CTA card linking to `/horses/new`
- Uses `@/i18n/navigation` `Link`

### `HomeUserSubsectionCard`
- Input: `href`, `label`, `icon`
- Grid card for owned entity sections (stables, trainers, etc.)
- Uses `@/i18n/navigation` `Link`

---

## 5. File Headers

Per AGENTS.md §11, every new/changed file gets a file header:

| File | Header |
|------|--------|
| `home-page-content-skeleton.tsx` | Body skeleton for guest/home landing pages. Used by `loading.tsx` (SSR) and `client.tsx` (auth/data loading). |
| `home-welcome-hero.tsx` | Guest landing hero card — Equus brand + title/subtitle. Pure presentational. |
| `home-guest-panel.tsx` | Guest CTA panel with sign-in and sign-up links. Called by `GuestLandingContent`. |
| `home-user-welcome-hero.tsx` | Signed-in user hero card — Equus brand + avatar + display name + subtitle. Pure presentational. |
| `home-user-add-horse-card.tsx` | Prominent CTA card linking to `/horses/new`. Called by `HomeContent`. |
| `home-user-subsection-card.tsx` | Grid card for owned entity subsections. Called by `HomeContent`. |
| `app/[locale]/client.tsx` | Guest landing content assembly — auth check, guest-only content gating. |
| `app/[locale]/home/client.tsx` | Signed-in home content assembly — auth check, data fetch, user home panels. |

Format follows `horse-page-shell.tsx`: what the file is for, who calls it, important boundaries.

---

## 6. i18n

### Existing keys (already in use, no changes required)
- `home.guestTitle`, `home.guestDescription`
- `home.getStartedTitle`, `home.getStartedDescription`
- `home.welcomeUser`, `home.welcomeSubtitle`
- `home.addHorseEyebrow`, `home.addHorseDescription`
- `home.profilesHeading`, `home.profilesDescription`
- `home.subsectionsLabel`
- `common.signIn`, `common.signUp`
- `metadata.home`, `metadata.homeDashboard`

### New key to add
- `home.loadFailed` → `en.json`: "Failed to load home content", `es.json`: "Error al cargar la página de inicio"

Used as `message` prop on `SectionErrorBoundary`.

---

## 7. Testing

Currently no home component tests exist (`tests/**/home*` returned no results).

New test file: `tests/components/home/home-page.test.tsx`

Covering:
- `HomePageContentSkeleton` — renders, `showSpinner` controls Spinner visibility, passes `suppressHydrationWarning`
- `HomeWelcomeHero` — renders title + subtitle
- `HomeGuestPanel` — renders title + description + sign-in/sign-up links
- `GuestLandingContent` (via `client.tsx`) — shows skeleton while auth loading, redirects when authenticated, shows guest panels when not
- `HomeContent` (via `home/client.tsx`) — shows skeleton while loading (auth or data), redirects to signin when not authenticated, renders user panels when ready (hero + add-horse card + subsection grid)

Use Vitest + `@testing-library/react` patterns matching existing tests in `tests/`.

---

## 8. Implementation Checklist

| # | Task | Files | Status |
|---|------|-------|--------|
| 1 | Create `home-page-content-skeleton.tsx` | `components/home/home-page-content-skeleton.tsx` | ✅ |
| 2 | Extract `HomeWelcomeHero` | `components/home/home-welcome-hero.tsx` | ✅ |
| 3 | Extract `HomeGuestPanel` | `components/home/home-guest-panel.tsx` | ✅ |
| 4 | Extract `HomeUserWelcomeHero` | `components/home/home-user-welcome-hero.tsx` | ✅ |
| 5 | Extract `HomeUserAddHorseCard` | `components/home/home-user-add-horse-card.tsx` | ✅ |
| 6 | Extract `HomeUserSubsectionCard` | `components/home/home-user-subsection-card.tsx` | ✅ |
| 7 | Rewrite `app/[locale]/page.tsx` | Remove Suspense, render from `./client.tsx` | ✅ |
| 8 | Create `app/[locale]/client.tsx` | Guest landing content assembly | ✅ |
| 9 | Create `app/[locale]/loading.tsx` | Uses `HomePageContentSkeleton` | ✅ |
| 10 | Rewrite `app/[locale]/home/page.tsx` | Remove dynamic(), render from `./client.tsx` | ✅ |
| 11 | Create `app/[locale]/home/client.tsx` | Signed-in home content assembly | ✅ |
| 12 | Update `app/[locale]/home/loading.tsx` | Replace bare `Skeleton` with `HomePageContentSkeleton` | ✅ |
| 13 | Add `home.loadFailed` i18n key | `messages/en.json`, `messages/es.json` | ✅ |
| 14 | Delete `home-page.tsx` | `components/home/home-page.tsx` | ✅ |
| 15 | Delete `user-home-page.tsx` | `components/home/user-home-page.tsx` | ✅ |
| 16 | Create unit tests | `tests/components/home/home-page.test.ts` | ✅ |
| 17 | Run `npm test` | All tests pass (688/688) | ✅ |
| 18 | Run `npm run lint` | No errors (0 errors, pre-existing warnings only) | ✅ |
| 19 | Manual verification | Cold load `/` (guest skeleton → guest panels), cold load `/home` (skeleton → user panels), navigation between pages, signed-in visiting `/` redirects to `/home` | ⏳ pending manual QA |

---

## 9. Completeness Gate

✅ **COMPLETE (2026-08-02):** All checklist items done, `npm test` (688/688) and `npm run lint` (0 errors) pass. Item 19 (manual QA) pending user verification. The guest/landing area is fully aligned with the blueprint, the horse module patterns, and AGENTS.md rules. No follow-up work remains — area 1 is done.
