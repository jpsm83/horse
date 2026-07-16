# Connect Page Flow — Optimization Design

**Date:** 2026-07-16
**Scope:** `app/[locale]/layout.tsx` → `connect/page.tsx` — the 5-file chain
**Goal:** Fix loading, error boundaries, SSR skeleton, TanStack Query compliance, and remove intermediary redundancy. Pattern becomes blueprint for all horse sub-pages.

## Phase 1: Fix `HorsePageShell` (Foundation)

All horse sub-pages use `HorsePageShell`. Fix its specific issues first.

### 1.1 Auth redirect flash
- **File:** `components/horses/horse-page-shell.tsx`
- **Problem:** When `isAuthenticated=false` and auth is resolved, the component renders `<Skeleton>` before `useEffect` fires `router.replace()`. Visible skeleton flash.
- **Fix:** Add early return `null` when redirect is known:
  ```tsx
  const isLoading = isAuthLoading || isHorseLoading;
  const shouldRedirect = !isLoading && !isAuthenticated;
  if (shouldRedirect) return null;
  ```

### 1.2 `placeholderData` on `useOwnerHorse`
- **File:** `components/horses/horse-page-shell.tsx` (or `hooks/queries/useHorse.ts`)
- **Problem:** Tab switches (Hub → Connect → Feed) cause `useOwnerHorse` to re-fetch and show skeleton each time. No cached data placeholder.
- **Fix:** Add `placeholderData: (prev) => prev` to the query definition in the hook. Verify the hook accepts this via TanStack Query v5.

### 1.3 `suppressHydrationWarning` placement
- **File:** `components/horses/horse-page-shell.tsx`
- **Problem:** Currently on the content `<div>` (line 72). Masks hydration mismatches across the entire content area, not just the skeleton.
- **Fix:** Move to the skeleton container only. The `<div>` wrapper around content does not need it when SSR sends matching markup.

### 1.4 Dead props: `title`, `backHref`, `backLabel`
- **File:** `components/horses/horse-page-shell.tsx`
- **Problem:** Component accepts these props but never renders them. `EntityTabs` is the header; there's no title bar or back button.
- **Fix:** Remove unused props from type and callers. The tab bar IS the page chrome.

## Phase 2: SSR Skeleton (`loading.tsx`)

### 2.1 New file: `app/[locale]/horses/[horseId]/connect/loading.tsx`
```tsx
import { HorsePageSkeleton } from "@/components/horses/horse-page-skeleton.tsx";
export default function ConnectLoading() {
  return <HorsePageSkeleton />;
}
```

### 2.2 New file: `components/horses/horse-page-skeleton.tsx`
- Shared skeleton component used by ALL horse sub-page `loading.tsx` files.
- Mirrors the skeleton already shown in `HorsePageShell` (green `<Skeleton>`), but at the route level so SSR renders it.
- Replace the inline `<Skeleton>` in `HorsePageShell` with this component for consistency.

### 2.3 Update existing files
- `app/[locale]/horses/[horseId]/loading.tsx` → use `HorsePageSkeleton` instead of bare `<Skeleton>`.

## Phase 3: TanStack Query Compliance

### 3.1 New hook: `hooks/queries/useEntitySearch.ts`
- Extracts raw `fetch()` from `EntitySearch` into a TanStack `useQuery`.
- Uses `enabled: query.trim().length >= 2` for debounce.
- Returns `{ data, isPending, error }` for self-contained rendering.

### 3.2 New hook: `hooks/queries/useInviteEntity.ts`
- `useMutation({ mutationFn, onSuccess: invalidate })` for inviting existing users.
- Post-invalidation clears `queryKeys.horses.relationships(horseId)` and `.providers(horseId)`.

### 3.3 New hook: `hooks/queries/useEmailInviteEntity.ts`
- Same pattern as `useInviteEntity` but for email-based invites.

### 3.4 Refactor `EntitySearch`
- Remove `useRef` debounce — TanStack `enabled` + `staleTime` handles it.
- Remove `useState` for `results`/`isSearching` — derive from query.
- Add `toast.error()` on query error instead of silent `catch { setResults([]) }`.

### 3.5 Remove raw `fetch()` from content assembly
- `HorseConnectPageContent` (or its replacement) no longer defines `handleInvite`/`handleEmailInvite`. Those are now hook calls from `InviteSection`.

## Phase 4: Error Boundary Coverage

### 4.1 Wrap every independent data section in `ErrorBoundary`
- **`InviteSection`** (extracted from `EntitySearch` + invite mutations) → wrapped in `<ErrorBoundary fallbackRender={InlineErrorFallback}>`
- **`ConnectionsTableSection`** → already wrapped (no changes needed)

### 4.2 Extract `InviteSection` component
- `components/horses/connect/invite-section.tsx`
- Self-contained: owns `useEntitySearch`, `useInviteEntity`, `useEmailInviteEntity`
- Inline skeleton during `isPending`, inline error via parent boundary
- Renders: search input + results list + email fallback form

### 4.3 Content assembly layout
```tsx
<HorsePageShell horseId={horseId}>
  <ErrorBoundary fallbackRender={InlineErrorFallback}>
    <InviteSection horseId={horseId} />
  </ErrorBoundary>
  <ErrorBoundary fallbackRender={InlineErrorFallback}>
    <ConnectionsTableSection horseId={horseId} />
  </ErrorBoundary>
</HorsePageShell>
```

## Phase 5: Eliminate Intermediary Layer

### 5.1 Rename/restructure `horse-connect-page-content.tsx`
- Move to `components/horses/connect/connect-content.tsx` (mirror the route structure).
- Remove raw `fetch()`, invite handlers, mutation logic — only compose `<HorsePageShell>` + sections.
- Keeps `horseId` as prop, renders the shell and section layout.

### 5.2 Update `connect/page.tsx`
- Imports and renders `ConnectContent` (from new location).
- Still a Server Component for `generateMetadata`.

## Phase 6: `placeholderData` on Connection Hooks

### 6.1 Verify/update query hooks
- `useHorseProviders` and `useHorsePendingRelationships` in `hooks/queries/useHorse.ts`
- Add `placeholderData: (prev) => prev` to each.
- `ConnectionsTableSection` destructures `{ data = [] }` — with `placeholderData`, the previous data persists during navigation, no skeleton flash.

## Phase 7: Blueprint Documentation

**Path:** `documentation/page-flow-blueprint.md`

The blueprint standardizes the pattern for ALL pages. After this, every existing horse sub-page is updated to match, and new pages are built following it. See next document.

## Risk Assessment

| Phase | Risk | Mitigation |
|---|---|---|
| P1 HorsePageShell | Low | Isolated component; easy to revert |
| P2 loading.tsx | Low | Pure addition; no existing code changed |
| P3 TanStack hooks | Medium | Need to verify API response shapes match |
| P4 Error boundaries | Low | Wrapping existing components |
| P5 Intermediary | Low | Keep old file as re-export during migration |
| P6 placeholderData | Low | Standard TanStack config change |
| P7 Blueprint | None | Documentation only |

## Rollout

1. Implement P1-P6 for the Connect page
2. Run tests, verify navigation flow manually (Hub → Connect → Feed → back to Connect)
3. Apply same pattern to remaining 9 horse sub-pages (feed, health, planning, events, documents, media, history, sale, edit)
4. Apply to non-horse entity pages (stables, breeders, etc.) as they're built
