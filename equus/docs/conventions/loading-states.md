# Loading states — how to write data sections

**Job:** Inline section loading. Not which skeleton **files** exist.  
**Also open (only if needed):** the section also fetches/mutates → [`data-fetching.md`](data-fetching.md). Wiring `SectionErrorBoundary` → [`error-handling.md`](error-handling.md). Which `loading.tsx`/skeleton **files** → [`../engineering/page-flow-blueprint.md`](../engineering/page-flow-blueprint.md).

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

- Each independent data section is its own component and owns its own `useQuery` with `placeholderData: (prev) => prev` (preserves cached data on tab switches).
- Each section shows its own inline skeleton during `isPending` — no full-page skeletons.
- Each section is wrapped in `SectionErrorBoundary` (see [`error-handling.md`](error-handling.md)).
- The parent never blocks on data — chrome renders immediately. Route `loading.tsx` uses the **body** skeleton, not a chrome duplicate (which files: page-flow-blueprint).
- `suppressHydrationWarning` on the content container when SSR renders a loading skeleton and the client immediately shows cached data.
- In-flight **mutations** (e.g. profile save) use `LoadingOverlay`. `Alert` is for persistent banners/form errors, not page loading.

Reference implementations: `HorseConnectionsTableSection` (Connect), `HorsePlanningCalendarSection` (Planning).
