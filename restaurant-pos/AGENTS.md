# restaurant-pos — Frontend Conventions

## Forms (web UI)

- Use **React Hook Form** + **Zod** (`zodResolver`) + shadcn **Field** primitives.
- Each input: `Controller` → `Field` + `FieldLabel` + control + `FieldError` under the input when invalid; set `data-invalid` and `aria-invalid` on errors.
- Client schemas live in `src/services/` (e.g. `businessProfileFormSchema.ts`); do not rely on native HTML `required` for Zod-managed fields (use `noValidate` on `<form>`).
- **Field-level** messages for validation; **top Alert** (or `setError` when API returns `error.fields`) for server/auth failures.
- Reuse existing form shell patterns (`BusinessProfileSettingsFormShell`) for data-dependent forms.

## Data Fetching — TanStack Query

All client-side data fetching uses **TanStack Query** (React Query v5).

- **`useQuery` for reads** — every page/component that calls a REST endpoint uses a dedicated query hook. No bare `fetch()` or `useEffect` + `useState` for async data.
- **`useMutation` for writes** — create, update, delete. Always invalidate related queries on success.
- **Query keys** — use the factory in `src/services/queryKeys.ts` for consistency and targeted invalidation.
- **Default config** — `staleTime: 60s`, `gcTime: 10min`, `retry: 2` (transient errors only). Override per query when needed.
- **Auth forms** (login, signup, password reset) are an **explicit exception** — they may use direct API calls since they always redirect on success and don't benefit from caching.

## State Handling

- Auth: React Context (`AuthContext`)
- Server state: TanStack Query
- Form state: React Hook Form
- No bare `useState` for form data or async data
