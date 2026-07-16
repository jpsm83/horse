# Page Flow Blueprint

Canonical pattern for all entity sub-pages in Equus. Every page follows this structure — loading states, error boundaries, data fetching, and component hierarchy are standardized.

## 1. Directory Structure

```
app/[locale]/horses/[horseId]/<tab>/
  page.tsx              ← Server Component: generateMetadata + one client render
  loading.tsx           ← SSR skeleton (mandatory)
```

For complex tabs with many sections, add a `components/horses/<tab>/` mirror:

```
components/horses/<tab>/
  <tab>-content.tsx     ← Client: content assembly (HorsePageShell + sections)
  <tab>-section-a.tsx   ← Self-contained data section
  <tab>-section-b.tsx   ← Self-contained data section
```

Simple tabs with one section can keep a single `<tab>-page-content.tsx` at `components/horses/`.

## 2. Server Component (`page.tsx`) — Thin

```tsx
import type { Metadata } from "next";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";
import { ConnectContent } from "@/components/horses/connect/connect-content.tsx";

type PageProps = { params: Promise<{ horseId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/horses/[horseId]/connect", "metadata.horseConnect");
}

export default async function ConnectPage({ params }: PageProps) {
  const { horseId } = await params;
  return <ConnectContent horseId={horseId} />;
}
```

Rules:
- Only `generateMetadata` — no data fetching on the server for content
- Single client component render — no server-side section logic
- No `"use client"`

## 3. `loading.tsx` — SSR Skeleton

```tsx
import { HorsePageSkeleton } from "@/components/horses/horse-page-skeleton.tsx";

export default function TabLoading() {
  return <HorsePageSkeleton />;
}
```

Rules:
- **Mandatory per route segment.** Without it, SSR sends empty content in `{children}`, causing a visible blank flash before JS hydration.
- Uses a shared `*PageSkeleton` component, not bare `<Skeleton>`.
- For non-horse entity pages, create an `EntityPageSkeleton` following the same pattern.

## 4. Content Assembly (`<tab>-content.tsx`)

The single Client Component that composes the shell + sections using the `<Section>` component.

```tsx
"use client";

import { useTranslations } from "next-intl";

import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { Section } from "@/components/shared/section.tsx";
import { InviteSection } from "@/components/horses/connect/invite-section.tsx";
import { ConnectionsTableSection } from "@/components/horses/connections-table-section.tsx";

type Props = { horseId: string };

export function ConnectContent({ horseId }: Props) {
  const t = useTranslations("horseConnect");

  return (
    <HorsePageShell horseId={horseId}>
      <Section
        title={t("inviteSection")}
        description={t("description")}
      >
        <InviteSection horseId={horseId} />
      </Section>

      <Section
        title={t("connectionsSection")}
        sectionKey="connect-connections"
        visibility={{ mode: "owner" }}
        onVisibilityChange={() => {}}
      >
        <ConnectionsTableSection horseId={horseId} />
      </Section>
    </HorsePageShell>
  );
}
```

Rules:
- No raw `fetch()` — all API calls go through TanStack Query hooks
- No mutation logic — mutations live in the section components
- Every section uses `<Section>` — never manual `<section>` wrappers
- No error boundary around the shell itself (shell is the chrome — it should not crash from section errors)
- Doesn't own data fetching or state — only composes sections

## 4.5. The `Section` Component (`components/shared/section.tsx`)

Reusable wrapper that standardizes section layout across all pages.

```tsx
"use client";

import { ErrorBoundary } from "react-error-boundary";
import type { ReactNode } from "react";

import { InlineErrorFallback } from "@/components/errors/inline-error-fallback.tsx";
import { SectionVisibilityPopover, type SectionVisibility } from "@/components/shared/section-visibility-popover.tsx";

type SectionProps = {
  title: string;
  description?: string;
  sectionKey?: string;
  visibility?: SectionVisibility;
  onVisibilityChange?: (visibility: SectionVisibility) => void;
  errorBoundary?: boolean;    // defaults true
  children: ReactNode;
};
```

### Layout
```
<section> flex min-h-0 flex-1 flex-col gap-4
  ├── <header> shrink-0
  │   ├── title + description
  │   └── SectionVisibilityPopover (if sectionKey + visibility + onVisibilityChange provided)
  └── children wrapped in ErrorBoundary (if errorBoundary true, default)
```

### Rules
- **Always** use `<Section>` for page sections — never raw `<section>` elements
- **`errorBoundary` defaults to true** — the `<Section>` automatically wraps children in `<ErrorBoundary fallbackRender={InlineErrorFallback}>`. If the children throw, the section header (title + toggle) stays visible and the body shows an inline error card with "Try Again".
- **Toggle is optional** — omit `sectionKey`, `visibility`, and `onVisibilityChange` to render a section without visibility control
- **Toggle requires all three props** — if one is missing, no toggle button renders
- **`errorBoundary={false}`** — opt out for sections with no data fetching (static info, pure forms)

## 5. Shell Component (`HorsePageShell`, `*PageShell`)

### 5.1 Responsibilities
1. Render chrome immediately (tabs — no data needed)
2. Gate content behind auth + ownership
3. Show skeleton while auth/data loads
4. Redirect on auth failure (return `null` to avoid skeleton flash)
5. Block content on permission failure (show "not allowed" fallback)

### 5.2 Auth redirect — no flash
```tsx
const isLoading = isAuthLoading || isHorseLoading;
const shouldRedirect = !isLoading && !isAuthenticated;

if (shouldRedirect) {
  return null;
}
```

### 5.3 Loading state
```tsx
if (isLoading || !horse) {
  return <HorsePageSkeleton />;
}
```

Reuses the same `<HorsePageSkeleton>` component used in `loading.tsx` for visual consistency.

### 5.4 Permission-denied fallback
```tsx
if (requireOwnership && !(horse.isMainOwner === true)) {
  return <div>...</div>;
}
```

### 5.5 Content
```tsx
return <>{children}</>;
```

## 6. Section Components — Self-Contained Data

Each section is a `"use client"` component that:
- Owns its own TanStack Query hooks (`useQuery`, `useMutation`)
- Shows inline skeleton during `isPending`
- Destructures data with fallback: `{ data = [] }`
- Uses `placeholderData: (prev) => prev` on all queries
- Does NOT define its own `ErrorBoundary` — the parent `<Section>` component wraps it automatically (unless `errorBoundary={false}`)
- Does NOT use raw `fetch()` — always through hooks

### Pattern
```tsx
"use client";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useHorseProviders } from "@/hooks/queries/useHorse.ts";

export function ConnectionsTableSection({ horseId }: { horseId: string }) {
  const t = useTranslations("horseConnect");
  const { data: providers = [], isPending } = useHorseProviders(horseId, "accepted", {
    placeholderData: (prev) => prev,
  });

  if (isPending) {
    return <Skeleton className="h-[400px] w-full rounded-lg" />;
  }

  return <DataTable /* ... */ />;
}
```

## 7. Error Boundary Strategy — Stacked Layers

```
global-error.tsx              ← Root layout crash (unrecoverable)
  └─ [locale]/error.tsx       ← App chrome crash (keeps layout, shows recovery page)
      └─ AppErrorBoundary     ← Higher app crash (resets on route change)
          └─ HorsePageShell   ← Chrome (EntityTabs, sidebar) — no inline boundary
              │                 (falls back to AppErrorBoundary if chrome itself crashes)
              ├─ <Section>    ← automatically wraps children in ErrorBoundary
              │   ├─ header (title + toggle) — survives crashes
              │   └─ ErrorBoundary → InviteSection
              │                   (fails → inline card, header + tabs survive)
              └─ <Section>    ← automatically wraps children in ErrorBoundary
                  ├─ header (title + toggle) — survives crashes
                  └─ ErrorBoundary → ConnectionsTableSection
                                  (fails → inline card, header + tabs survive)
```

Rules:
- `ErrorBoundary` only wraps **data-dependent children**, not the section header
- The `<Section>` component provides the ErrorBoundary automatically (when `errorBoundary` is not set to `false`)
- If children throw, the section header (title + visibility toggle) stays visible — the user can still navigate via tabs
- Each section is isolated — one failing does not cascade
- `AppErrorBoundary` is the last resort, not the first line of defense
- `InlineErrorFallback` is compact (card + Try Again button) — never full-page

## 8. Data Fetching Rules

1. **All client-side API calls** use TanStack Query (`useQuery` / `useMutation`)
2. **No raw `fetch()`** in any component — use hooks from `hooks/queries/`
3. **`placeholderData: (prev) => prev`** on every query — eliminates skeleton flash on tab switches
4. **`staleTime: 30_000`** (global default) — prevents repeated fetches on mount
5. **`enabled:`** for conditional queries (e.g. search needs min 2 chars)
6. **Query key factory** — use `queryKeys` (not ad-hoc arrays) for targeted invalidation

## 9. Mutation Rules

1. Use `useMutation` — never `fetch().then()` in event handlers
2. `onSuccess` invalidates related queries
3. `onError` shows toast via `useAppToast()` — never silent `catch`
4. Mutation loading state: disable the submit button, show spinner text

## 10. i18n Rules

1. Content assembly calls `useTranslations` once and passes translated strings to sections (via props or the section calls it directly)
2. Sections call their own `useTranslations` when they have distinct namespaces
3. No hardcoded user-facing text

## 11. Checklist for New Horse Sub-Pages

```
[ ] Create `app/[locale]/horses/[horseId]/<tab>/page.tsx` — thin Server Component
[ ] Create `app/[locale]/horses/[horseId]/<tab>/loading.tsx` — uses HorsePageSkeleton
[ ] Create `components/horses/<tab>-content.tsx` — HorsePageShell + `<Section>` components
[ ] For each data section in the tab:
    [ ] Extract into a dedicated `"use client"` section component
    [ ] Wrap it in `<Section title={...}>` (not raw `<section>`, not manual ErrorBoundary)
    [ ] Add `sectionKey` + `visibility` + `onVisibilityChange` for toggleable visibility
    [ ] Set `errorBoundary={false}` if section has no data fetching
    [ ] Use TanStack Query hooks (no raw fetch)
    [ ] Use `placeholderData: (prev) => prev`
    [ ] Show inline skeleton during `isPending`
    [ ] Handle errors with toast for mutations, ErrorBoundary for render errors
[ ] Verify: tabs survive if one section crashes (header + other sections remain)
[ ] Verify: navigation between tabs shows no skeleton (placeholderData)
[ ] Verify: full page load (SSR) shows skeleton immediately, not after hydration
```

## 12. Page Type Variants

| Type | Shell Component | Skeleton Component |
|---|---|---|
| Horse sub-page | `HorsePageShell` | `HorsePageSkeleton` |
| Stable sub-page | `StablePageShell` | `StablePageSkeleton` |
| Breeder sub-page | `BreederPageShell` | `BreederPageSkeleton` |
| (other entities) | `*PageShell` | `*PageSkeleton` |

Each entity type creates its own shell + skeleton following the exact same pattern.
