# Page flow — file map

**Job:** Which files make an entity page (chrome, loading, shell, Save).  
**Upstream:** n/a (platform)  
**Status:** **aligned**  
**Code roots:** `app/[locale]/horses/[horseId]/`, `components/horses/`, `lib/navigation/horseTabs.ts` (and user/stable equivalents)

Naming/coding rules: [`../conventions/ui-layout-naming.md`](../conventions/ui-layout-naming.md), [`../conventions/nextjs-conventions.md`](../conventions/nextjs-conventions.md). Tabs: [`horseTabs.md`](horseTabs.md), [`userTabs.md`](userTabs.md). Overlays: [`../conventions/ui-styling.md`](../conventions/ui-styling.md).

---

## Shipped

```
app/[locale]/horses/[horseId]/
  layout.tsx     ← HorseLayoutChrome (EntityTabs)
  page.tsx       ← metadata + client Hub
  client.tsx     ← Hub assembly (useHorseView)
  loading.tsx    ← HorsePageContentSkeleton
  <tab>/{page,client,loading}.tsx
```

| Type | Shell | Body skeleton |
|------|--------|----------------|
| Horse | `HorsePageShell` | `HorsePageContentSkeleton` |
| User account | `UserPageShell` | `UserPageContentSkeleton` |
| Stable | `StablePageShell` | `StablePageContentSkeleton` |

Layout does **not** seed TanStack cache. Child `client.tsx` loads `GET /api/v1/…/view` (horse: `useHorseView`). Hub has no ownership gate (`HorsePageShell` skipped).

**Loading:** `loading.tsx` uses the **same** body skeleton as the shell. How to write sections (inline skeleton, `placeholderData`, no Suspense, `suppressHydrationWarning`): [`../conventions/loading-states.md`](../conventions/loading-states.md), [`../conventions/data-fetching.md`](../conventions/data-fetching.md). Boundaries: [`errors.md`](errors.md).

**Parent-owned Save** (Profile, Admin sale/visibility): one `useForm` in tab `client.tsx`, one Save, field sections get `control` only, dirty → `UnsavedChangesProvider`. Immediate actions (invites, transfers, deactivate) stay in their sections.

**Tables:** Connect, Documents, History, Admin use `components/table` (`DataTable`, `TableUserAvatarCell`, …). Visual SoT: Admin History.

**User split:** public `/users/[userId]` = `useUserHub`; owner Hub tab = same `UserHubContent` via `useUserView`. See [`users.md`](users.md).
