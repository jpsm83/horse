# Frontend error handling

Equus uses **three layers** for uncaught UI failures. Expected API failures stay in feature `try/catch` + toasts/redirects — not error boundaries.

## Layers

| Layer | File | Catches |
|-------|------|---------|
| **Global** | `app/global-error.tsx` | Root layout / document failures (no i18n, no providers) |
| **Locale segment** | `app/[locale]/error.tsx` | Uncaught errors in locale pages/layout children that bubble to the segment |
| **App tree** | `components/errors/app-error-boundary.tsx` | Client render errors inside `AppProviders` (sidebar/header stay visible) |

All recovery UIs share `components/errors/error-recovery-page.tsx` (translated via `status.error`).

## react-error-boundary

`AppErrorBoundary` wraps the full client tree in `components/providers/app-providers.tsx`:

- `FallbackComponent` → `ErrorFallback` → `ErrorRecoveryPage`
- `resetKeys={[pathname]}` — navigating away clears the fallback
- `onError` → `lib/errors/logClientError.ts`

## Logging

`lib/errors/logClientError.ts` is the single hook for client error reporting. Extend it when adding Sentry or similar.

## What boundaries do **not** handle

| Case | Pattern |
|------|---------|
| API `4xx` / `5xx` | `try/catch` in page/feature code; `useAppToast()` or redirect |
| Auth session expired | `apiFetch` refresh + `AuthSessionProvider` redirect |
| Form validation | RHF + Zod field errors |
| Page loading | Skeleton / `loading.tsx` — not `Alert` or error boundary |
| `notFound()` | `not-found.tsx` via `StatusPageShell` |

## Adding feature-level isolation (optional)

Wrap a risky client subtree with another `ErrorBoundary` from `react-error-boundary` and reuse `ErrorFallback`. Prefer segment `error.tsx` only when the whole route should recover independently.

## Related

- [`auth.md`](./auth.md) — session-expired flow
- [`profile.md`](./profile.md) — loading skeleton + mutation overlay patterns
