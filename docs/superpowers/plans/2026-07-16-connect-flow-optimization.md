# Connect Page Flow Optimization — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix loading/skeleton, error boundary coverage, TanStack Query compliance, and intermediary redundancy in the 5-file Connect page flow. Pattern becomes blueprint for all horse sub-pages.

**Architecture:** Refactor the existing `HorsePageShell` → `HorseConnectPageContent` → section components chain layer by layer. Fix the shell first (foundation for all horse pages), then SSR skeleton, then hooks, then error boundaries, then assembly.

**Tech Stack:** Next.js 16 App Router, React 19, TanStack Query v5, react-error-boundary, next-intl

## Global Constraints

- All existing data-section hooks must use `placeholderData: (prev) => prev`
- No raw `fetch()` in any component — always through hooks in `hooks/queries/`
- Every independent data section must be wrapped in `<ErrorBoundary fallbackRender={InlineErrorFallback}>`
- `HorsePageShell` must early-return `null` when redirecting to avoid skeleton flash
- `suppressHydrationWarning` only on skeleton containers, not content divs
- `HorsePageSkeleton` is the canonical skeleton component for all horse sub-pages
- `HorsePageShell` drops unused `title`, `backHref`, `backLabel` props

---

### Task 1: Create `HorsePageSkeleton`

**Files:**
- Create: `components/horses/horse-page-skeleton.tsx`

- [ ] **Step 1: Create `horse-page-skeleton.tsx`**

```tsx
import { Skeleton } from "@/components/ui/skeleton.tsx";

export function HorsePageSkeleton() {
  return <Skeleton className="h-[600px] w-full rounded-lg bg-green-800" />;
}
```

This mirrors the inline skeleton currently in `HorsePageShell:75`. Using a shared component ensures visual consistency between the route-level `loading.tsx` (SSR) and the shell-level loading state (client).

---

### Task 2: Fix `HorsePageShell`

**Files:**
- Modify: `components/horses/horse-page-shell.tsx`

**Callers to update (remove dead props):**
- `components/horses/horse-connect-page-content.tsx`
- `components/horses/horse-hub-page-content.tsx`
- `components/horses/horse-feed-page-content.tsx`
- `components/horses/horse-health-page-content.tsx`

- [ ] **Step 1: Remove dead props from type and interface**

Current type:
```tsx
type HorsePageShellProps = {
  horseId: string;
  title: string;
  backHref?: string;
  backLabel?: string;
  requireOwnership?: boolean;
  children: ReactNode | ((props: HorsePageShellRenderProps) => ReactNode);
};
```

Change to:
```tsx
type HorsePageShellProps = {
  horseId: string;
  requireOwnership?: boolean;
  children: ReactNode | ((props: HorsePageShellRenderProps) => ReactNode);
};
```

- [ ] **Step 2: Fix auth redirect flash**

Add early return before the skeleton block:

```tsx
// In HorsePageShell, after isLoading calculation
const shouldRedirect = !isLoading && !isAuthenticated;

// Add before the JSX return
if (shouldRedirect) {
  return null;
}
```

This prevents rendering the skeleton when we know the useEffect will fire `router.replace()` in the same tick.

- [ ] **Step 3: Fix `suppressHydrationWarning` placement**

Move `suppressHydrationWarning` from the content `<div>` (line 72) to the skeleton `<Skeleton>` element (the one inside the `isLoading || !horse` check on line 74-76).

If using `HorsePageSkeleton`, pass `suppressHydrationWarning` as a prop or wrap it:

```tsx
{isLoading || !horse ? (
  <HorsePageSkeleton suppressHydrationWarning />
) : requireOwnership && !(horse.isMainOwner === true) ? (
  // ...permission denied
) : (
  <div className="mx-auto flex w-full flex-1 flex-col gap-8 px-4 py-4 sm:py-6">
    {/* content */}
  </div>
)}
```

- [ ] **Step 4: Update callers — remove `title`, `backHref`, `backLabel` props**

In `horse-connect-page-content.tsx`:
```tsx
// Before:
<HorsePageShell horseId={horseId} title={t("title")} requireOwnership>
// After:
<HorsePageShell horseId={horseId} requireOwnership>
```

In `horse-hub-page-content.tsx`:
```tsx
// Before:
<HorsePageShell
  horseId={horseId}
  title={horseName}
  backHref="/horses"
  backLabel={t("backToHorses")}
>
// After:
<HorsePageShell horseId={horseId}>
```

In `horse-feed-page-content.tsx`:
```tsx
// Before:
<HorsePageShell horseId={horseId} title={t("title")} requireOwnership>
// After:
<HorsePageShell horseId={horseId} requireOwnership>
```

In `horse-health-page-content.tsx`:
```tsx
// Before:
<HorsePageShell horseId={horseId} title={t("title")} requireOwnership>
// After:
<HorsePageShell horseId={horseId} requireOwnership>
```

- [ ] **Step 5: Use `HorsePageSkeleton` instead of inline `<Skeleton>`**

Replace:
```tsx
{isLoading || !horse ? (
  <Skeleton className="h-full w-full rounded-lg bg-green-800" />
) : ...
```

With:
```tsx
{isLoading || !horse ? (
  <HorsePageSkeleton />
) : ...
```

- [ ] **Step 6: Update horse-hub-page-content.tsx to use `HorsePageShell` correctly**

The Hub page no longer passes `title`, `backHref`, `backLabel`. Since these were never rendered, the UI is unchanged. Remove the unused `useTranslations("common")` call if `tCommon` was only used for `title`.

After removing props, `horse-hub-page-content.tsx`:
```tsx
export function HorseHubPageContent({ horseId }: HorseHubPageContentProps) {
  const t = useTranslations("horseHub");
  const tCommon = useTranslations("common");
  const { data: horse } = useOwnerHorse(horseId);

  const horseName = horse?.name ?? tCommon("horseFallback");
  const subtitle = horse?.breed
    ? [horse.breed, horse.sex].filter(Boolean).join(" · ")
    : t("subtitle");

  return (
    <HorsePageShell horseId={horseId}>
      {/* content */}
    </HorsePageShell>
  );
}
```

`tCommon` is still needed for `horseFallback` fallback, so keep it.

---

### Task 3: Add `connect/loading.tsx`

**Files:**
- New: `app/[locale]/horses/[horseId]/connect/loading.tsx`
- Modify: `app/[locale]/horses/[horseId]/loading.tsx` — use `HorsePageSkeleton`

- [ ] **Step 1: Create `connect/loading.tsx`**

```tsx
import { HorsePageSkeleton } from "@/components/horses/horse-page-skeleton.tsx";

export default function ConnectLoading() {
  return <HorsePageSkeleton />;
}
```

- [ ] **Step 2: Update `[horseId]/loading.tsx`** to use the shared skeleton:

```tsx
import { HorsePageSkeleton } from "@/components/horses/horse-page-skeleton.tsx";

export default function HorseHubLoading() {
  return <HorsePageSkeleton />;
}
```

---

### Task 4: Add `useEntitySearch` hook + query key

**Files:**
- Modify: `lib/api/queryKeys.ts`
- Create: `hooks/queries/useEntitySearch.ts`

- [ ] **Step 1: Add search key to `queryKeys.ts`**

Add after `invites`:
```tsx
search: {
  entities: (q: string) => ["search", "entities", q] as const,
},
```

- [ ] **Step 2: Create `useEntitySearch.ts`**

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";

type EntitySearchResult = {
  id: string;
  name: string;
  email: string;
  entityType: string;
  entityLabel: string;
};

type EntitySearchResponse = {
  results: EntitySearchResult[];
};

async function fetchEntitySearch(query: string): Promise<EntitySearchResult[]> {
  const res = await fetch(`/api/v1/search/entities?q=${encodeURIComponent(query.trim())}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Search failed");
  const data: EntitySearchResponse = await res.json();
  return data.results ?? [];
}

export function useEntitySearch(query: string) {
  return useQuery({
    queryKey: queryKeys.search.entities(query),
    queryFn: () => fetchEntitySearch(query),
    enabled: query.trim().length >= 2,
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
  });
}
```

---

### Task 5: Create `InviteSection` component

**Files:**
- Create: `components/horses/connect/invite-section.tsx`

- [ ] **Step 1: Create `invite-section.tsx`**

This component replaces the raw `fetch()` + `useState` pattern in `EntitySearch` and the invite handlers in `HorseConnectPageContent`. It uses `useEntitySearch` for search and `useCreateRelationshipInvite` for mutations.

```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Search, UserPlus, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEntitySearch } from "@/hooks/queries/useEntitySearch.ts";
import { useCreateRelationshipInvite } from "@/hooks/queries/useRelationship.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";

type InviteSectionProps = {
  horseId: string;
};

export function InviteSection({ horseId }: InviteSectionProps) {
  const t = useTranslations("horseConnect");
  const toast = useAppToast();
  const [query, setQuery] = useState("");
  const [showEmailFallback, setShowEmailFallback] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const { data: results = [], isPending: isSearching, error: searchError } = useEntitySearch(query);
  const inviteMutation = useCreateRelationshipInvite();

  function handleInvite(receiverAccountId: string, relationshipType: string) {
    inviteMutation.mutate(
      { horseId, receiverAccountId, relationshipType },
      {
        onSuccess: () => toast.success(t("invitationSent")),
        onError: () => toast.error(t("invitationCancelled")),
      },
    );
  }

  function handleEmailInvite() {
    if (!email.trim()) return;
    inviteMutation.mutate(
      { horseId, invitedEmail: email.trim(), invitedName: name.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(t("invitationSent"));
          setEmail("");
          setName("");
          setShowEmailFallback(false);
          setQuery("");
        },
        onError: () => toast.error(t("invitationCancelled")),
      },
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("searchPlaceholder")}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowEmailFallback(false);
          }}
          className="pl-9"
        />
      </div>

      {isSearching && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("searching")}
        </div>
      )}

      {searchError && (
        <p className="text-sm text-destructive">{t("searchError")}</p>
      )}

      {results.length > 0 && (
        <ul className="space-y-2">
          {results.map((result) => (
            <li
              key={result.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{result.name}</p>
                <p className="text-xs text-muted-foreground">
                  {result.entityLabel} · {result.email}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => handleInvite(result.id, result.entityType)}
                disabled={inviteMutation.isPending}
              >
                <UserPlus className="mr-1 h-3 w-3" />
                {t("invite")}
              </Button>
            </li>
          ))}
        </ul>
      )}

      {!isSearching && query.trim().length >= 2 && results.length === 0 && !searchError && !showEmailFallback && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{t("noResults")}</p>
          <Button variant="outline" size="sm" onClick={() => setShowEmailFallback(true)}>
            <Mail className="mr-1 h-3 w-3" />
            {t("emailFallbackToggle")}
          </Button>
        </div>
      )}

      {showEmailFallback && (
        <div className="space-y-3 rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">{t("emailFallbackHint")}</p>
          <div className="space-y-2">
            <Input
              placeholder={t("emailLabel")}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              placeholder={t("nameLabel")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <Button
            size="sm"
            onClick={handleEmailInvite}
            disabled={!email.trim() || inviteMutation.isPending}
          >
            {t("sendEmailInvite")}
          </Button>
        </div>
      )}
    </div>
  );
}
```

---

### Task 6: Create `connect-content.tsx` (new content assembly)

**Files:**
- Create: `components/horses/connect/connect-content.tsx`

- [ ] **Step 1: Create `connect-content.tsx`**

This is the new content assembly that replaces `horse-connect-page-content.tsx`. It composes `HorsePageShell` + error-bounded sections.

```tsx
"use client";

import { useTranslations } from "next-intl";
import { ErrorBoundary } from "react-error-boundary";

import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { InviteSection } from "@/components/horses/connect/invite-section.tsx";
import { ConnectionsTableSection } from "@/components/horses/connections-table-section.tsx";
import { InlineErrorFallback } from "@/components/errors/inline-error-fallback.tsx";

type ConnectContentProps = {
  horseId: string;
};

export function ConnectContent({ horseId }: ConnectContentProps) {
  const t = useTranslations("horseConnect");

  return (
    <HorsePageShell horseId={horseId} requireOwnership>
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">{t("inviteSection")}</h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <InviteSection horseId={horseId} />
        </ErrorBoundary>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t("connectionsSection")}</h2>
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          <ConnectionsTableSection horseId={horseId} />
        </ErrorBoundary>
      </section>
    </HorsePageShell>
  );
}
```

Note: The section `<div>` structure wraps each section in its own `<ErrorBoundary>` — if `InviteSection` crashes, the Connections table still works and vice versa.

---

### Task 7: Update `connect/page.tsx` and remove old files

**Files:**
- Modify: `app/[locale]/horses/[horseId]/connect/page.tsx`
- Remove: `components/horses/horse-connect-page-content.tsx`
- Remove: `components/horses/entity-search.tsx`

- [ ] **Step 1: Update `connect/page.tsx`**

```tsx
import type { Metadata } from "next";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";
import { ConnectContent } from "@/components/horses/connect/connect-content.tsx";

type PageProps = { params: Promise<{ horseId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/horses/[horseId]/connect", "metadata.horseConnect");
}

export default async function HorseConnectPage({ params }: PageProps) {
  const { horseId } = await params;
  return <ConnectContent horseId={horseId} />;
}
```

- [ ] **Step 2: Remove `horse-connect-page-content.tsx`**

The file `components/horses/horse-connect-page-content.tsx` is fully replaced by `components/horses/connect/connect-content.tsx` + `InviteSection`. Delete it.

- [ ] **Step 3: Remove `entity-search.tsx`**

The file `components/horses/entity-search.tsx` is fully replaced by `components/horses/connect/invite-section.tsx`. Delete it.

---

### Task 8: Add `placeholderData` to `useOwnerHorse`

**Files:**
- Modify: `hooks/queries/useHorse.ts`

- [ ] **Step 1: Add `placeholderData` to `useOwnerHorse`**

Current:
```tsx
export function useOwnerHorse(horseId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.horses.owner(horseId!),
    queryFn: () => fetchOwnerHorse(horseId!),
    enabled: !!horseId,
  });
}
```

Change to:
```tsx
export function useOwnerHorse(horseId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.horses.owner(horseId!),
    queryFn: () => fetchOwnerHorse(horseId!),
    enabled: !!horseId,
    placeholderData: (previousData) => previousData,
  });
}
```

This preserves the horse data during tab navigation. When switching from Hub to Connect, `useOwnerHorse` returns the previously fetched data immediately while re-fetching in the background — no skeleton flash.

---

### Task 9: Remove unused i18n keys (if any)

After Tasks 5-7, the `EntitySearch` component no longer exists, and the invite logic is in `InviteSection`. Both use the `horseConnect` translation namespace. Verify that `searchError` key exists in translation files, or that the error message is derived from the error object.

- [ ] **Step 1: Check `messages/en.json` for `horseConnect.searchError`**

If the key doesn't exist, add it:
```json
"horseConnect": {
  ...
  "searchError": "Search failed. Please try again."
}
```

Do similarly for `es.json` if required.

---

## Verification

After all tasks are complete:

1. **Run tests:** `npm test` — verify existing tests pass
2. **Manual verification:**
   - Navigate to `/horses/123/connect` (fresh page load) → skeleton should render on SSR, no empty content flash
   - Tab navigation (Hub → Connect → Feed → back to Connect) → no skeleton flash on `useOwnerHorse`, data preserved via `placeholderData`
   - Trigger an error in `InviteSection` (e.g., break the search API response) → section shows inline error card, Connections table and tabs survive
   - Trigger an error in `ConnectionsTableSection` → only the table section shows error card, Invite section and tabs survive
   - Unauthenticated user → skeleton doesn't flash before redirect to sign-in
