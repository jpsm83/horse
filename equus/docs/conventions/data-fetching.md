# Data fetching — how to write TanStack Query

**Job:** Client-side reads/writes through `/api/v1`. Not which view/hub endpoints exist.  
**Also open (only if needed):** **adding a new data-driven UI section** → [`loading-states.md`](loading-states.md) and [`error-handling.md`](error-handling.md). Which page/shell files → [`../engineering/page-flow-blueprint.md`](../engineering/page-flow-blueprint.md). UI↔API import boundary → [`architecture.md`](architecture.md).

All client-side data fetching uses **TanStack Query** (React Query v5). Domain hooks live in `hooks/queries/`.

- **REST only from the UI** — layouts and pages do not prefetch via `lib/services` or `connectDb()`. Client sections use TanStack hooks that call `/api/v1`. `loading.tsx` covers first paint.
- **`useQuery` for reads** — every page/component that calls a REST endpoint uses a dedicated query hook. No bare `fetch()` or `useEffect` + `useState` for async data.
- **`useMutation` for writes** — create, update, delete. Always invalidate related queries on success (e.g. `queryClient.invalidateQueries({ queryKey: ["horses"] })`).
- **Query keys** — use the factory in `lib/api/queryKeys.ts` for consistency and targeted invalidation.
- **Shared fetch utility** — `lib/api/fetchWithAuth.ts` handles cookies + token refresh; TanStack hooks call it. `lib/api/auth/session.ts` owns auth session state (synchronous context).
- **Auth state is not TanStack Query** — `useAppAuth()` remains driven by the `session.ts` observer pattern. TanStack Query only handles async server data.
- **Default config** — `staleTime: 30_000`, `gcTime: 5 * 60_000`, `retry: 1`, `refetchOnWindowFocus: true`. Override per query when needed (e.g. `staleTime: 0` for real-time lists).
- **No `useSuspenseQuery`, no `<Suspense>` for data** — sections use `useQuery` with `placeholderData` and inline skeletons. Do not wrap page content in `<Suspense>` for hydration mismatch mitigation — use `suppressHydrationWarning` on the content container instead.
- **New hooks** — add domain hooks to `hooks/queries/` following the existing pattern. Keep query functions colocated with the hook.
