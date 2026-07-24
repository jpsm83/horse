# Component-level resilience (loading + errors)

Every page component should be built so the **shell renders immediately** and **data-dependent sections manage their own loading and error states independently**. A failure in one section never takes down the chrome or other sections.

## Philosophy

| Principle | Rationale |
|-----------|-----------|
| **Chrome never blocks on data** | Tabs, title, back button render instantly. Auth/ownership gates only the content area, never the shell. |
| **Each section owns its data** | Data fetching, loading skeleton, and error handling are co-located in the same component. No parent orchestrates child loading states. |
| **Fail independently** | `ErrorBoundary` per section. A crashing table doesn't break the invite section next to it. |
| **Cache-first navigation** | `placeholderData` preserves the last valid data during navigation so the skeleton only shows on true cold loads. |

---

## Loading pattern: immediate chrome + deferred content

`HorsePageShell` is the reference implementation (`components/horses/horse-page-shell.tsx`).

```
┌───────────────────────────────────────┐
│  EntityTabs (always renders)           │  ← immediate, no data needed
├───────────────────────────────────────┤
│  ← Back button                        │  ← immediate
│  Page title                            │
├───────────────────────────────────────┤
│  ┌──── Content area ────────────────┐ │
│  │  loading → HorsePageContentSkele. │ │  ← compact, content-only
│  │  resolved → section components    │ │  ← each owns its own state
│  │  not owner → "not allowed" msg    │ │
│  └────────────────────────────────────┘ │
└───────────────────────────────────────┘
```

### What this means in practice

- `HorsePageShell` runs auth + owner queries but never returns a full-page skeleton. It always renders `<EntityTabs>`, the back link, and the title.
- While auth/owner data is loading, only the content children area shows `<HorsePageContentSkeleton>` (a compact, generic placeholder).
- Once data resolves, children render with their own data-driven skeletons (`HorseConnectionsTableSection` shows a table-row skeleton).
- Redirects (unauthenticated, 403, error) are handled in a `useEffect` side effect — they never block the render.

### Creating a new page section

1. Create a component that owns its data fetch (e.g. `HorseConnectionsTableSection`)
2. Use `useQuery` with `placeholderData: (prev) => prev`:
   ```typescript
   const { data = [], isPending } = useQuery({
     queryKey,
     queryFn,
     placeholderData: (previousData) => previousData,
   });
   ```
3. Check `isPending` → render an inline skeleton (not a full-page one)
4. Render the data-driven UI when resolved
5. Wrap the section in an `ErrorBoundary` in the parent:

   ```typescript
   <section>
     <h2>Section Title</h2>
     <ErrorBoundary fallbackRender={({ error, resetErrorBoundary }) => (
       <InlineErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />
     )}>
       <SectionComponent horseId={horseId} />
     </ErrorBoundary>
   </section>
   ```

---

## Error pattern: component-level ErrorBoundary

Add `InlineErrorFallback` (`components/errors/inline-error-fallback.tsx`) as a compact inline card with a "Try again" button.

### Retry semantics

When the user clicks "Try again":
1. `resetErrorBoundary` re-mounts the children inside the `ErrorBoundary`
2. The children's `useQuery` fires again (TanStack Query auto-retries)
3. A brief skeleton shows during the retry fetch
4. If the error persists, the boundary catches it again and shows `InlineErrorFallback`

This is correct behavior — the skeleton during retry is expected and brief.

### When to use component-level vs global

| Scope | Mechanism | File |
|-------|-----------|------|
| **App-wide render crash** | `AppErrorBoundary` (`react-error-boundary` + `ErrorFallback`) | `components/errors/app-error-boundary.tsx` |
| **Route segment crash** | `error.tsx` | `app/[locale]/error.tsx` |
| **Root layout crash** | `global-error.tsx` | `app/global-error.tsx` |
| **Section-level failure** | `ErrorBoundary` + `InlineErrorFallback` | Per feature component |

### What boundaries do **not** handle

| Case | Pattern |
|------|---------|
| API `4xx` / `5xx` | `try/catch` + `useAppToast()` or redirect |
| Auth session expired | `apiFetch` refresh + `AuthSessionProvider` redirect |
| Form validation | RHF + Zod field errors |
| Expected empty state | `DataTable` `emptyStateMessage` — not an error boundary |

---

## SSR and data fetching considerations

### The SSR/CSR split

```
Server Component (page.tsx)
  └── Client Component (page content)
        └── useQuery for data  ← client-only fetch
```

On **initial page load (SSR)**:
1. The server renders the Server Component (`page.tsx`) and its Client Component tree to generate HTML
2. The Client Component's hooks DO run during SSR but produce a **loading state** because no cache exists yet (TanStack Query has no server-side cache)
3. `loading.tsx` shows during the SSR window (use a minimal skeleton there)
4. The server sends HTML with the content area in **loading state** (e.g. `<HorsePageContentSkeleton />`)
5. The client hydrates and immediately runs hooks — if TanStack Query has cached data, the client renders **differently** than the server

On **client-side navigation** (Hub → Connect):
1. No server request — the client renders the new route's components locally
2. TanStack Query returns cached data synchronously (if available)
3. `placeholderData` preserves the last valid data, so `isPending` is `false` for warm navigations

### Handling hydration mismatches

The content area is intentionally different between server (loading skeleton) and client (cached data). This is **not an error** — it's the correct behavior for cookie-authenticated data. However, React's hydration process detects the difference and throws warnings or, in some cases, Suspense instrumentation errors.

The fix: `suppressHydrationWarning` on the content container in `HorsePageShell`:

```tsx
<div className="mx-auto flex w-full flex-1 flex-col gap-8 px-4 py-4 sm:py-6" suppressHydrationWarning>
  {isLoading || !horse ? (
    <HorsePageContentSkeleton />
  ) : (
    // children with real data
  )}
</div>
```

This tells React to accept that this subtree's HTML may differ from the client render. React takes the DOM from SSR and replaces it with the client version during hydration. The chrome above this div (EntityTabs, title, back button) does NOT have `suppressHydrationWarning` — it always renders identically.

Do **not** wrap the page content in `<Suspense>` for this purpose — Suspense boundaries around mismatched content cause "Offscreen Fiber" errors in React DevTools instrumentation. Use `suppressHydrationWarning` on the mismatched container instead.

### Why not useSuspenseQuery

**Do not use** `useSuspenseQuery` for cookie-authenticated data. The fetch uses relative URLs (`/api/v1/...`) that fail during SSR because:
- The server cannot resolve relative URLs the same way as the client
- Cookie-based auth requires the browser's cookie jar, which isn't available during SSR

Use standard `useQuery` with explicit `isPending` checks instead. The skeleton inside the component replaces the need for Suspense boundaries.

### placeholderData for zero-flash navigation

```typescript
useQuery({
  queryKey: myKey,
  queryFn: myFetchFn,
  placeholderData: (previousData) => previousData,
});
```

- **Cold load** (no cache): `previousData` is `undefined` → `placeholderData` returns `undefined` → `isPending: true` → skeleton shows. Same as before.
- **Warm navigation** (tab switch): `previousData` has cached data → `placeholderData` returns it → `isPending: false` → the component renders with data immediately, without any skeleton flash. A background refetch updates the data if stale.
- **Stale cache**: Same as warm navigation — cached data shows instantly, background refetch updates when it resolves.

This is the key pattern for eliminating skeleton flashes during tab-to-tab navigation.

### Prefetching on navigation intent (future optimization)

For even faster transitions, prefetch data when the user shows intent to navigate:

```typescript
import { useQueryClient } from "@tanstack/react-query";

function TabBar() {
  const queryClient = useQueryClient();
  const horseId = useHorseId();

  const prefetchConnect = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.horses.providers(horseId!),
      queryFn: () => fetchProviders(horseId!),
      staleTime: 30_000,
    });
    queryClient.prefetchQuery({
      queryKey: queryKeys.horses.relationships(horseId!),
      queryFn: () => fetchPendingRelationships(horseId!),
      staleTime: 30_000,
    });
  };

  return (
    <Link href="/connect" onMouseEnter={prefetchConnect}>
      Connect
    </Link>
  );
}
```

Not yet implemented in the codebase; add when needed.

---

## How to replicate across the app

### For a new page

1. **`page.tsx`** (Server Component) — render the content component directly. No `Suspense` wrapper unless the content uses `useSuspenseQuery`.
2. **`loading.tsx`** — use a minimal skeleton (`HorsePageContentSkeleton` or a small spinner). Avoid full-page skeletons.
3. **`HorsePageShell`** (already shared) — renders chrome immediately. Add your content as children.
4. **Content components** — extract each independent data section into its own component:
   - Own `useQuery` hooks
   - `isPending` → inline skeleton
   - Wrapped in `ErrorBoundary` + `InlineErrorFallback` in the parent

### Checklist

- [ ] Chrome renders without waiting for data (tabs, title, back button)
- [ ] Content area uses `suppressHydrationWarning` if it renders differently on server vs client (loading skeleton → real data)
- [ ] Each data section uses `useQuery` with `placeholderData: (prev) => prev`
- [ ] Each data section shows an inline skeleton during `isPending`
- [ ] Each data section is wrapped in its own `ErrorBoundary` with `InlineErrorFallback`
- [ ] `loading.tsx` uses a minimal skeleton (not a full-page duplicate)
- [ ] No `useSuspenseQuery` for cookie-authenticated data
- [ ] No `<Suspense>` wrapping page content components (causes hydration instrumentation errors)
- [ ] Redirects are `useEffect` side effects (not render blockers)

---

## Related

- [`errors.md`](./errors.md) — error boundary layers and fallback components
- [`profile.md`](./profile.md) — Suspense + skeleton reference (legacy pattern)
- [`../AGENTS.md`](../AGENTS.md) — loading state conventions and TanStack Query config
