# Loading states (web UI)

**Mandatory pattern — every data-driven section follows this:**

```
Page / Layout (Server Component)
  └── renders chrome immediately (tabs, title, back button)
      └── Content section that fetches data
          ├── ErrorBoundary with InlineErrorFallback
          │   └── SectionComponent (self-contained)
          │       ├── isPending → inline skeleton (never full-page)
          │       └── resolved → data UI
```

**Rules enforced for every feature:**

- [ ] Each independent data section is extracted into its own component
- [ ] Each section owns its own `useQuery` with `placeholderData: (prev) => prev` (preserves cached data on tab switches, eliminating skeleton flashes)
- [ ] Each section shows its own inline skeleton during `isPending` — no full-page skeletons
- [ ] Each section is wrapped in `<ErrorBoundary fallbackRender={InlineErrorFallback}>` (use the shared `SectionErrorBoundary` — see [`error-handling.md`](error-handling.md))
- [ ] The parent never blocks on data — chrome renders immediately (route `loading.tsx` uses a minimal skeleton like `HorsePageContentSkeleton`, not a chrome duplicate)
- [ ] `suppressHydrationWarning` on the content container when SSR renders a loading skeleton and the client immediately shows cached data
- [ ] In-flight **mutations** (e.g. profile save) use `LoadingOverlay`; `Alert` is for persistent banners/form errors, not page loading

Reference implementations: `HorseConnectionsTableSection` (Connect tab), `HorsePlanningCalendarSection` (Planning tab). See [equus/docs/engineering/component-resilience.md](../engineering/component-resilience.md).
