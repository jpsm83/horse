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

Wrap a risky client subtree with another `ErrorBoundary` from `react-error-boundary`. Prefer segment `error.tsx` only when the whole route should recover independently.

For section-level isolation (recommended — see [`component-resilience.md`](./component-resilience.md)):

```tsx
import { ErrorBoundary } from "react-error-boundary";
import { InlineErrorFallback } from "@/components/errors/inline-error-fallback.tsx";

<section>
  <h2>Section title</h2>
  <ErrorBoundary
    fallbackRender={({ error, resetErrorBoundary }) => (
      <InlineErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />
    )}
  >
    <DataComponent />
  </ErrorBoundary>
</section>
```

`InlineErrorFallback` renders a compact bordered card with the error message and a "Try again" button. It is designed for component-level boundaries where the surrounding page chrome must remain visible. For full-page recovery use `ErrorRecoveryPage` via `ErrorFallback`.

### Retry semantics

When the user clicks "Try again":
1. `resetErrorBoundary` re-mounts `DataComponent` inside the boundary
2. The component's `useQuery` fires again (TanStack Query auto-retries)
3. The component shows its inline skeleton during the retry fetch
4. If the error persists, the boundary catches it again and shows `InlineErrorFallback`

## Related

- [`component-resilience.md`](./component-resilience.md) — component-level loading + error patterns
- [`auth.md`](./auth.md) — session-expired flow
- [`profile.md`](./profile.md) — loading skeleton + mutation overlay patterns
