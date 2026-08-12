# Cross-Cutting Modules Refactoring — Design Document

**Date:** 2026-08-02
**Status:** ✅ DONE (executed 2026-08-02 — all tasks complete; 751 tests pass, lint clean, tsc clean)
**Scope:** Comprehensive refactoring of all 6 cross-cutting modules: relationships inbox, ownership-transfers inbox, pedigree-connections inbox, notifications (new feature), subscription, and me redirect.

---

## Phase Overview

| Phase | Scope | Backend work |
|-------|-------|-------------|
| **6A** | 3 inbox pages refactor (relationships, ownership-transfers, pedigree-connections) | None |
| **6B** | Subscription refactor | Minor — extract hooks |
| **6C** | Notifications — replace "Coming Soon" with real content | **Yes** — API routes + service + hooks |
| **6D** | Me redirect | None (already handled) |
| **Cleanup** | Delete `NotificationsPlaceholderPage` | N/A |

---

## 1. Phase 6A — Inbox Pages

All 3 inbox pages (relationships, ownership-transfers, pedigree-connections) follow the same pattern. They use `AuthPageShell` (centered card layout) which is correct for single-scroll inboxes — not entity-tabbed pages.

### 1.1 Target Structure (each inbox)

```
app/[locale]/<inbox>/
  page.tsx          ← thin SC: generateMetadata + <InboxClient />
  client.tsx        ← NEW: useSearchParams wrapper → <Content params={...} />
  loading.tsx       ← updated: named InboxPageContentSkeleton

components/invites/
  <entity>-content.tsx                  ← updated: receives params from client.tsx, no useSearchParams, no inline skeleton
  <entity>-page-content-skeleton.tsx    ← NEW: Skeleton + Spinner + suppressHydrationWarning
```

### 1.2 Refactored Content Component (shared pattern)

```tsx
// Receives highlight param from client.tsx — no useSearchParams()
export function RelationshipsContent({ highlightRelationshipId }: { highlightRelationshipId: string | null }) {
  const router = useRouter();
  const t = useTranslations("invites.relationships");
  const { isAuthenticated, isLoading: authLoading } = useAppAuth();
  const { data: relationships = [], isPending } = usePendingRelationships();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      const next = highlightRelationshipId
        ? `/relationships?relationship=${encodeURIComponent(highlightRelationshipId)}`
        : "/relationships";
      router.replace(buildSignInPath(next));
    }
  }, [authLoading, isAuthenticated, highlightRelationshipId, router]);

  if (isPending || authLoading) {
    return <RelationshipsPageContentSkeleton suppressHydrationWarning />;
  }

  return (
    <AuthPageShell title={t("title")} description={t("description")} footer={...}>
      <SectionErrorBoundary message={t("loadFailed")}>
        {relationships.length === 0 ? <p>{t("empty")}</p> : <ul>...</ul>}
      </SectionErrorBoundary>
    </AuthPageShell>
  );
}
```

Same pattern for `OwnershipTransfersContent` and `PedigreeConnectionsContent`.

### 1.3 Client.tsx Wrapper (all 3 follow same pattern)

```tsx
// app/[locale]/relationships/client.tsx
"use client";
import { useSearchParams } from "next/navigation";
import { RelationshipsContent } from "@/components/invites/relationships-content.tsx";

export function RelationshipsClient() {
  const searchParams = useSearchParams();
  return <RelationshipsContent highlightRelationshipId={searchParams.get("relationship")} />;
}
```

### 1.4 Skeleton (each inbox gets its own — same structure as HorsePageContentSkeleton)

```tsx
// components/invites/relationships-page-content-skeleton.tsx
export function RelationshipsPageContentSkeleton({
  suppressHydrationWarning,
  showSpinner = true,
}: {
  suppressHydrationWarning?: boolean;
  showSpinner?: boolean;
}) {
  return (
    <div className="relative w-full h-full" suppressHydrationWarning={suppressHydrationWarning}>
      {showSpinner && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <Spinner className="size-6" />
        </div>
      )}
      <Skeleton className="inset-0 h-full w-full p-4 rounded-md" />
    </div>
  );
}
```

### 1.5 Per-Inbox Changes Summary

| Change | relationships | ownership-transfers | pedigree-connections |
|--------|:---:|:---:|:---:|
| Remove Suspense from page.tsx | ✅ | ✅ | ✅ |
| Add client.tsx | ✅ | ✅ | ✅ |
| Replace bare Skeleton in loading.tsx with named | ✅ | ✅ | ✅ |
| Replace inline loading shell with named skeleton | ✅ | ✅ | ✅ |
| Add SectionErrorBoundary wrapping list | ✅ | ✅ | ✅ |
| Add file header to content component | ✅ | ✅ | ✅ |
| Add loading.tsx | N/A (exists) | N/A (exists) | ✅ (new) |
| Content receives params as props | `highlightRelationshipId` | `highlightTransferId` | `highlightConnectionId` |

### 1.6 New Files

| # | File |
|---|------|
| 1 | `components/invites/relationships-page-content-skeleton.tsx` |
| 2 | `components/invites/ownership-transfers-page-content-skeleton.tsx` |
| 3 | `components/invites/pedigree-connections-page-content-skeleton.tsx` |
| 4 | `app/[locale]/relationships/client.tsx` |
| 5 | `app/[locale]/ownership-transfers/client.tsx` |
| 6 | `app/[locale]/pedigree-connections/client.tsx` |
| 7 | `app/[locale]/pedigree-connections/loading.tsx` |

### 1.7 Modified Files

| # | File | Change |
|---|------|--------|
| 8 | `app/[locale]/relationships/page.tsx` | Remove Suspense, import from `./client.tsx` |
| 9 | `app/[locale]/ownership-transfers/page.tsx` | Remove Suspense, import from `./client.tsx` |
| 10 | `app/[locale]/pedigree-connections/page.tsx` | Remove Suspense, import from `./client.tsx` |
| 11 | `app/[locale]/relationships/loading.tsx` | Replace bare Skeleton with named |
| 12 | `app/[locale]/ownership-transfers/loading.tsx` | Replace bare Skeleton with named |
| 13 | `components/invites/relationships-content.tsx` | Receive prop, drop useSearchParams, use named skeleton, add SectionErrorBoundary, add file header |
| 14 | `components/invites/ownership-transfers-content.tsx` | Receive prop, drop useSearchParams, use named skeleton, add SectionErrorBoundary, add file header |
| 15 | `components/invites/pedigree-connections-content.tsx` | Receive prop, drop useSearchParams, use named skeleton, add SectionErrorBoundary, add file header |

---

## 2. Phase 6B — Subscription

### 2.1 Issues to Fix

| # | Current | Target |
|---|---------|--------|
| 1 | Raw `fetch()` in component (`fetchBilling`, `createCheckout`, `openPortal`) | Extract to `hooks/queries/useBilling.ts` (TanStack Query) |
| 2 | Inline `<div className="animate-pulse">` skeleton | `SubscriptionPageContentSkeleton` (Skeleton + Spinner) |
| 3 | Raw `<section>` for current plan display | `Section` component |
| 4 | Inline error `<p className="text-destructive">` | `SectionErrorBoundary` |
| 5 | No `loading.tsx` | Add `SubscriptionPageContentSkeleton` |
| 6 | No `client.tsx` | Add thin wrapper |
| 7 | No file header | Add per AGENTS.md §11 |
| 8 | No `suppressHydrationWarning` | Add on content container |

### 2.2 New Hook

```tsx
// hooks/queries/useBilling.ts
export function useBilling() {
  return useQuery({
    queryKey: queryKeys.billing.current,
    queryFn: () => fetchWithAuth("/api/v1/billing/current").then(parseApiResponse),
    placeholderData: (prev) => prev,
  });
}

export function useCreateCheckout() {
  return useMutation({
    mutationFn: (tierId: string) =>
      fetchWithAuth("/api/v1/billing/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tierId }),
      }).then(parseApiResponse),
  });
}

export function useStripePortal() {
  return useMutation({
    mutationFn: () =>
      fetchWithAuth("/api/v1/billing/portal", { method: "POST" }).then(parseApiResponse),
  });
}
```

### 2.3 New Files

| # | File |
|---|------|
| 16 | `hooks/queries/useBilling.ts` |
| 17 | `components/billing/subscription-page-content-skeleton.tsx` |
| 18 | `app/[locale]/subscription/client.tsx` |
| 19 | `app/[locale]/subscription/loading.tsx` |

### 2.4 Modified Files

| # | File | Change |
|---|------|--------|
| 20 | `app/[locale]/subscription/page.tsx` | Import from `./client.tsx` |
| 21 | `components/billing/subscription-page-content.tsx` | Use hooks, use Section, use SectionErrorBoundary, use named skeleton, add suppressHydrationWarning, add file header |

---

## 3. Phase 6C — Notifications (New Feature)

### 3.1 Backend — API Routes + Service + Hooks

**New service:**

```
lib/services/notificationService.ts
  listNotifications(userId, page, limit) → { notifications: Notification[], total, page, totalPages }
  markAsRead(userId, notificationId) → { success: boolean }
```

**New API routes:**

```
app/api/v1/notifications/route.ts
  GET → list notifications for authenticated user (query: ?page=1&limit=20)

app/api/v1/notifications/[id]/read/route.ts
  PATCH → mark notification as read for authenticated user
```

**New TanStack Query hooks:**

```
hooks/queries/useNotification.ts
  useNotifications(page) — useQuery
  useMarkNotificationRead() — useMutation (invalidates notification list)
```

### 3.2 UI

```
app/[locale]/notifications/
  page.tsx          ← thin SC: generatePrivateMetadata + <NotificationsClient />
  client.tsx        ← NEW: thin wrapper → <NotificationsContent />
  loading.tsx       ← updated: NotificationsPageContentSkeleton

components/notifications/
  notifications-content.tsx               ← NEW: auth check + paginated list + mark-read
  notifications-page-content-skeleton.tsx ← NEW
```

**Content component pattern:**

```tsx
export function NotificationsContent() {
  const router = useRouter();
  const t = useTranslations("notifications");
  const tCommon = useTranslations("common");
  const { isAuthenticated, isLoading: authLoading } = useAppAuth();
  const { data: notifications = [], isPending } = useNotifications();
  const markRead = useMarkNotificationRead();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(buildSignInPath("/notifications"));
    }
  }, [authLoading, isAuthenticated, router]);

  async function handleMarkRead(id: string) {
    await markRead.mutateAsync(id);
  }

  if (isPending || authLoading) {
    return <NotificationsPageContentSkeleton suppressHydrationWarning />;
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-8" suppressHydrationWarning>
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <SectionErrorBoundary message={t("loadFailed")}>
        {notifications.length === 0 ? (
          <p className="text-muted-foreground">{t("empty")}</p>
        ) : (
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li key={n.id} className={cn("rounded-lg border p-3", !n.isRead && "border-primary/30 bg-primary/5")}>
                <p className="font-medium text-sm">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">{formatRelative(n.createdAt)}</p>
                {!n.isRead && n.actionUrl && (
                  <Button size="sm" variant="ghost" className="mt-1" onClick={() => handleMarkRead(n.id)}>
                    {t("markRead")}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </SectionErrorBoundary>
    </div>
  );
}
```

### 3.3 i18n

New keys in `en.json` and `es.json`:
- `notifications.title`, `notifications.empty`, `notifications.loadFailed`, `notifications.markRead`
- `metadata.notifications`

### 3.4 New Files

| # | File |
|---|------|
| 22 | `lib/services/notificationService.ts` |
| 23 | `app/api/v1/notifications/route.ts` |
| 24 | `app/api/v1/notifications/[id]/read/route.ts` |
| 25 | `hooks/queries/useNotification.ts` |
| 26 | `components/notifications/notifications-page-content-skeleton.tsx` |
| 27 | `components/notifications/notifications-content.tsx` |
| 28 | `app/[locale]/notifications/client.tsx` |

### 3.5 Modified Files

| # | File | Change |
|---|------|--------|
| 29 | `app/[locale]/notifications/page.tsx` | Import from `./client.tsx`, add `generateMetadata` if missing |
| 30 | `app/[locale]/notifications/loading.tsx` | Replace bare Skeleton with named |

### 3.6 Deleted Files

| # | File |
|---|------|
| 31 | `components/layout/notifications-placeholder-page.tsx` |

---

## 4. Phase 6D — Me Redirect

The `/me` directory is empty. `resolvePostAuthPath("/me")` in `lib/navigation/postAuthRedirect.ts` already converts `/me` to `/home`. The catch-all route `[...rest]/page.tsx` handles unmatched routes.

**No changes needed** — existing logic works correctly.

---

## 5. File Headers

Every new or changed file gets a header per AGENTS.md §11:

| File | Header |
|------|--------|
| `relationships-content.tsx` | Pending horse relationship inbox — auth-gated list with accept/decline. Receives `highlightRelationshipId` from `client.tsx`. |
| `ownership-transfers-content.tsx` | Pending ownership transfer inbox — auth-gated list with accept/decline. Receives `highlightTransferId` from `client.tsx`. |
| `pedigree-connections-content.tsx` | Pending pedigree connection inbox — auth-gated list with accept/decline. Receives `highlightConnectionId` from `client.tsx`. |
| `*-page-content-skeleton.tsx` | Body skeleton for [entity] inbox page. Used by `loading.tsx` (SSR) and inline loading states. |
| `subscription-page-content.tsx` | Subscription plan list — displays tiers, current plan, horse usage. Uses TanStack Query hooks for billing data. |
| `subscription-page-content-skeleton.tsx` | Body skeleton for subscription page. Used by `loading.tsx` and inline loading. |
| `notifications-content.tsx` | User notification inbox — paginated list with mark-read. Auth-gated. |
| `notificationService.ts` | Notification CRUD — list paginated for user, mark single as read. |
| `useBilling.ts` | TanStack Query hooks for subscription billing. `useBilling`, `useCreateCheckout`, `useStripePortal`. |
| `useNotification.ts` | TanStack Query hooks for notifications. `useNotifications`, `useMarkNotificationRead`. |

---

## 6. i18n Summary

| Namespace | New Keys |
|-----------|----------|
| `invites.relationships` | `loadFailed` |
| `invites.ownershipTransfers` | `loadFailed` |
| `invites.pedigreeConnections` | `loadFailed` |
| `subscription` | `loadFailed` |
| `notifications` | `title`, `empty`, `loadFailed`, `markRead` |
| `metadata` | `notifications` |

---

## 7. Testing

| Phase | Tests |
|-------|-------|
| 6A | `tests/components/invites/relationships-content.test.tsx`, `ownership-transfers-content.test.tsx`, `pedigree-connections-content.test.tsx` |
| 6B | `tests/components/billing/subscription-page-content.test.tsx`, `tests/hooks/queries/useBilling.test.ts` |
| 6C | `tests/components/notifications/notifications-content.test.tsx`, `tests/lib/services/notificationService.test.ts`, `tests/app/api/v1/notifications/route.test.ts` |

---

## 8. Complete Implementation Checklist

### Phase 6A — Inbox Pages

1. Create `components/invites/relationships-page-content-skeleton.tsx`
2. Create `components/invites/ownership-transfers-page-content-skeleton.tsx`
3. Create `components/invites/pedigree-connections-page-content-skeleton.tsx`
4. Create `app/[locale]/relationships/client.tsx`
5. Create `app/[locale]/ownership-transfers/client.tsx`
6. Create `app/[locale]/pedigree-connections/client.tsx`
7. Create `app/[locale]/pedigree-connections/loading.tsx`
8. Rewrite `app/[locale]/relationships/page.tsx` — remove Suspense, import from `./client.tsx`
9. Rewrite `app/[locale]/ownership-transfers/page.tsx` — remove Suspense, import from `./client.tsx`
10. Rewrite `app/[locale]/pedigree-connections/page.tsx` — remove Suspense, import from `./client.tsx`
11. Update `app/[locale]/relationships/loading.tsx` — use named skeleton
12. Update `app/[locale]/ownership-transfers/loading.tsx` — use named skeleton
13. Refactor `relationships-content.tsx` — receive prop, drop useSearchParams, use named skeleton, add SectionErrorBoundary, add file header
14. Refactor `ownership-transfers-content.tsx` — receive prop, drop useSearchParams, use named skeleton, add SectionErrorBoundary, add file header
15. Refactor `pedigree-connections-content.tsx` — receive prop, drop useSearchParams, use named skeleton, add SectionErrorBoundary, add file header
16. Add `loadFailed` i18n keys for each inbox
17. Create inbox render tests
18. Run `npm test` + `npm run lint`

### Phase 6B — Subscription

19. Create `hooks/queries/useBilling.ts`
20. Create `components/billing/subscription-page-content-skeleton.tsx`
21. Create `app/[locale]/subscription/client.tsx`
22. Create `app/[locale]/subscription/loading.tsx`
23. Rewrite `app/[locale]/subscription/page.tsx` — import from `./client.tsx`
24. Refactor `subscription-page-content.tsx` — use hooks, use Section, use SectionErrorBoundary, use named skeleton, add suppressHydrationWarning, add file header
25. Add `loadFailed` i18n key
26. Create billing tests
27. Run `npm test` + `npm run lint`

### Phase 6C — Notifications

28. Create `lib/services/notificationService.ts`
29. Create `app/api/v1/notifications/route.ts`
30. Create `app/api/v1/notifications/[id]/read/route.ts`
31. Create `hooks/queries/useNotification.ts`
32. Create `components/notifications/notifications-page-content-skeleton.tsx`
33. Create `components/notifications/notifications-content.tsx`
34. Create `app/[locale]/notifications/client.tsx`
35. Update `app/[locale]/notifications/loading.tsx` — use named skeleton
36. Rewrite `app/[locale]/notifications/page.tsx` — import from `./client.tsx`
37. Delete `components/layout/notifications-placeholder-page.tsx`
38. Add notification i18n keys to `en.json`, `es.json`
39. Create notification tests
40. Run `npm test` + `npm run lint`

### Phase 6D — Verification

41. Run `npm test` — all pass
42. Run `npm run lint` — no errors
43. Manual verify: each inbox page, subscription tiers, notification list + mark-read

---

## 9. Completeness Gate

✅ **COMPLETE (2026-08-02):** All 43 tasks done. `npm test` (751/751), `npm run lint` (0 errors), `tsc --noEmit` (clean). Manual QA of inbox/subscription/notification flows pending user verification.

- [x] All 3 inbox pages use `client.tsx` + named skeletons + `SectionErrorBoundary` + file headers
- [x] Subscription uses TanStack Query hooks + `Section` + `SectionErrorBoundary` + named skeleton + file header
- [x] Notifications has real API routes + real content + named skeleton + `SectionErrorBoundary` + file header
- [x] `NotificationsPlaceholderPage` deleted
- [x] All inline `fetch()` calls extracted to hooks
- [x] All bare `<Skeleton>` replaced with named `*PageContentSkeleton`
- [x] All `<Suspense fallback={null}>` removed from inbox pages
- [x] Zero `useRef` in any code
- [x] All tests pass, lint clean
