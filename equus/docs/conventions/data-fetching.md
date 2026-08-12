# Data fetching — TanStack Query

All client-side data fetching uses **TanStack Query** (React Query v5). Domain hooks live in `hooks/queries/`.

* **`useQuery` for reads** — every page/component that calls a REST endpoint uses a dedicated query hook (e.g. `useHorse(id)` → `GET /api/v1/horses/:id`). No bare `fetch()` or `useEffect` + `useState` for async data.
* **`useMutation` for writes** — create, update, delete. Always invalidate related queries on success (e.g. `queryClient.invalidateQueries({ queryKey: ["horses"] })`).
* **Query keys** — use the factory in `lib/api/queryKeys.ts` for consistency and targeted invalidation.
* **Shared fetch utility** — `lib/api/fetchWithAuth.ts` handles cookies + token refresh; TanStack hooks call it. `lib/api/auth/session.ts` owns auth session state (synchronous context).
* **Auth state is not TanStack Query** — `useAppAuth()` remains driven by the `session.ts` observer pattern. TanStack Query only handles async server data.
* **Default config** — `staleTime: 30_000`, `gcTime: 5 * 60_000`, `retry: 1`, `refetchOnWindowFocus: true`. Override per query when needed (e.g. `staleTime: 0` for real-time lists).
* **No `useSuspenseQuery`, no `<Suspense>`** — all data sections use `useQuery` with `placeholderData` and inline skeletons. Do **not** wrap page content in `<Suspense>` for hydration mismatch mitigation — use `suppressHydrationWarning` on the content container instead. See [equus/docs/engineering/component-resilience.md](../engineering/component-resilience.md).
* **New hooks** — add domain hooks to `hooks/queries/` following the existing pattern. Keep query functions colocated with the hook.
