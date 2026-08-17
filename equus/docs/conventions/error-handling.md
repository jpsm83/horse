# Error handling — how to write UI failures

**Job:** When to use a section boundary vs toast/redirect. Not which error files exist.  
**Also open (only if needed):** which error **files** exist → [`../engineering/errors.md`](../engineering/errors.md). New data section skeleton → [`loading-states.md`](loading-states.md). Session/auth-load failure path → [`../engineering/auth.md`](../engineering/auth.md).

- **Component-level boundaries** — wrap each independent data section in `SectionErrorBoundary` (`components/errors/section-error-boundary.tsx`). It composes react-error-boundary with `InlineErrorFallback`, reports via `logClientError`, and supports `resetKeys` (e.g. `[horseId]`) + a translated `message`. A failing section never takes down chrome or other sections.
- **Do not** use error boundaries for expected load failures or API 4xx/5xx. Use skeleton + toast/redirect from [`loading-states.md`](loading-states.md).
- **API / auth failures** — `try/catch` in features; toasts (`useAppToast`) or redirect — **not** error boundaries. Auth-load failures (network down on initial load) render the unauthenticated view with `console.error` + toast — never an infinite spinner.
