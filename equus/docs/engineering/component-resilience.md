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

`HorseLayoutChrome` and `HorsePageShell` are the reference implementations.

```
┌───────────────────────────────────────┐
│  EntityTabs (always renders)           │  ← HorseLayoutChrome, immediate
├───────────────────────────────────────┤
│  ┌──── Content area ────────────────┐ │
│  │  loading → HorsePageContentSkeleton│ │  ← SSR streaming phase
│  │  auth gating → same skeleton      │ │  ← HorsePageShell (same component)
│  │  resolved → Section wrapper       │ │  ← renders immediately (headings)
│  │    └─ Skeleton + Spinner          │ │  ← section owns its loading state
│  │    └─ DataTable or error          │ │  ← resolved or error state
│  │  not owner → "not allowed" msg    │ │
│  └────────────────────────────────────┘ │
└───────────────────────────────────────┘
```

### What this means in practice

- `HorseLayoutChrome` (in the layout) always renders `EntityTabs` immediately. The tabs show pending skeleton state while auth and horse view data loads.
- While the page-level auth/data is loading, only the content children area shows `<HorsePageContentSkeleton>` (a compact, generic placeholder).
- `loading.tsx` renders the **same** `<HorsePageContentSkeleton>` component — no visual swap between SSR and client hydration.
- Once data resolves, children render — the `Section` wrapper renders immediately (headers, buttons). Only data-dependent children within the section show their own skeleton.
- `HorsePageShell` checks auth via `useAppAuth()` and reads horse data via `useHorseView()` (`GET /api/v1/horses/:id`). `placeholderData: (prev) => prev` keeps cached data visible during background refetch — no unnecessary skeleton flashes.
- Redirects (unauthenticated) are handled in a `useEffect` side effect — they never block the render.

### Creating a new page section

1. Create a component that owns its data fetch (e.g. `HorseConnectionsTableSection`)
2. Create a sibling skeleton component (e.g. `HorseConnectionsTableSkeleton`)
3. The skeleton uses the `Skeleton` primitive (defaults to `variant="skeleton"` → `bg-skeleton`) with a `Spinner` overlay:
   ```tsx
   // HorseConnectionsTableSkeleton
   import { Skeleton } from "@/components/ui/skeleton.tsx";
   import { Spinner } from "@/components/ui/spinner.tsx";

   export function HorseConnectionsTableSkeleton({ showSpinner = true }) {
     return (
       <div className="relative w-full h-full">
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
4. The section component uses `useQuery` with `placeholderData` (defined inside the hook) and handles both `isPending` and `isError`:
   ```tsx
   const { data = [], isPending, isError } = useSomeQuery(horseId);
   if (isPending) return <HorseConnectionsTableSkeleton />;
   if (isError) return <p className="text-destructive">{t("loadFailed")}</p>;
   return <DataTable data={data} />;
   ```
5. Wrap the section in `SectionErrorBoundary` inside the `client.tsx` parent (composes react-error-boundary with `InlineErrorFallback`, logs via `logClientError`, and auto-resets on `resetKeys` change):
    ```tsx
    import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";

    <Section title={t("sectionTitle")}>
      <SectionErrorBoundary resetKeys={[horseId]} message={t("loadFailed")}>
        <HorseConnectionsTableSection horseId={horseId} />
      </SectionErrorBoundary>
    </Section>
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

### Why no useSuspenseQuery

**Do not use** `useSuspenseQuery` — every data section uses standard `useQuery`. The fetch uses relative URLs (`/api/v1/...`) that fail during SSR because:
- The server cannot resolve relative URLs the same way as the client
- Cookie-based auth requires the browser's cookie jar, which isn't available during SSR

Use standard `useQuery` with explicit `isPending` checks and `placeholderData: (prev) => prev` instead. The inline skeleton replaces the need for Suspense boundaries.

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

1. **`page.tsx`** (Server Component) — render the content component directly. No `Suspense` wrapper.
2. **`loading.tsx`** — use a minimal skeleton (`HorsePageContentSkeleton` or a small spinner). Avoid full-page skeletons.
3. **`HorsePageShell`** (already shared) — renders chrome immediately. Add your content as children.
4. **Content components** — extract each independent data section into its own component:
   - Own `useQuery` hooks
   - `isPending` → inline skeleton
   - Wrapped in `ErrorBoundary` + `InlineErrorFallback` in the parent

### Checklist

- [ ] Chrome renders without waiting for data (tabs, title, back button)
- [ ] Content area uses `suppressHydrationWarning` if it renders differently on server vs client (loading skeleton → real data)
- [ ] `loading.tsx` and `HorsePageShell` use the **same** skeleton component — no visual swap on SSR→client transition
- [ ] Each data section uses `useQuery` with `placeholderData: (prev) => prev` (defined inside the hook)
- [ ] Each data section destructures `{ data = [], isPending, isError }` — shows skeleton on pending, error message on error
- [ ] Each data section's skeleton uses the `Skeleton` component with `variant="skeleton"` (default, `bg-skeleton`) + `Spinner` overlay
- [ ] Each data section is wrapped in its own `SectionErrorBoundary` (`InlineErrorFallback` + `logClientError` + `resetKeys`) in the parent `client.tsx`
- [ ] `loading.tsx` uses a minimal skeleton (not a full-page duplicate)
- [ ] No `useSuspenseQuery`
- [ ] No `<Suspense>` wrapping page content components (causes hydration instrumentation errors)
- [ ] Redirects are `useEffect` side effects (not render blockers)

---

## Related

- [`errors.md`](errors.md) — error boundary layers and fallback components
- [`profile.md`](profile.md) — deferred Save, loading skeleton + mutation overlay patterns
- [`../AGENTS.md`](../../AGENTS.md) — loading state and data fetching conventions (`equus/docs/conventions/data-fetching.md` + `equus/docs/conventions/loading-states.md`)
