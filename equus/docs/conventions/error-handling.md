# Error handling (web UI)

* **Component-level boundaries** — wrap each independent data section in its own error boundary. Use the shared **`SectionErrorBoundary`** (`components/errors/section-error-boundary.tsx`) — it composes react-error-boundary with `InlineErrorFallback`, reports crashes via `logClientError`, and supports `resetKeys` (e.g. `[horseId]`) + a translated `message`. A failing section never takes down the chrome or other sections.
* **Uncaught render errors** — `react-error-boundary` via `AppErrorBoundary` in `AppProviders`; Next.js `app/[locale]/error.tsx` and `app/global-error.tsx`. Shared UI: `components/errors/error-recovery-page.tsx`.
* **API / auth failures** — `try/catch` in features; toasts (`useAppToast`) or redirect — **not** error boundaries. Auth-load failures (network down on initial load) render the unauthenticated view with `console.error` + toast — never an infinite spinner.
* **Do not** use error boundaries for expected load failures; use skeleton + redirect patterns from [equus/docs/engineering/component-resilience.md](../engineering/component-resilience.md) and [equus/docs/engineering/errors.md](../engineering/errors.md).
