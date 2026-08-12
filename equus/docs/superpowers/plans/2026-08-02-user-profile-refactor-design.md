# User Profile Area — Gap-Filling Plan

**Date:** 2026-08-02
**Status:** ✅ DONE (executed 2026-08-02 — all 13 tasks complete; 722 tests pass, lint clean, tsc clean)
**Scope:** Minimal gap-filling for the user profile module. The user module is already the second best-built module in the app (after horse), following the blueprint almost exactly. Only 7 small gaps found across 3 categories.

---

## Assessment

The user module follows the blueprint correctly:
- `layout.tsx` with RSC prefetch + `PreferHydrationBoundary` ✅
- `page.tsx` + `client.tsx` + `loading.tsx` on all 8 routes ✅
- `UserPageShell` auth + self-ownership gate ✅
- `UserLayoutChrome` + `EntityTabs` + `UnsavedChangesProvider` ✅
- `Section` + `SectionErrorBoundary` wrapping all data sections ✅
- Named `UserPageContentSkeleton` in all tab loading files ✅ (one exception)
- Deferred forms: parent `useForm` + single Save ✅
- `UserSectionVisibility` Layer-2 adapter ✅
- Public/owner hub sharing `UserHubContent` ✅
- `suppressHydrationWarning` on content containers ✅
- File headers on 25 of 27 component files ✅
- No `<Suspense>` antipatterns ✅
- No raw `<section>` elements ✅

---

## Gaps

### Gap 1 — File Headers (2 files)

| File | Issue | Fix |
|------|-------|-----|
| `components/user/user-page-content-skeleton.tsx:4` | Single-line `/** Canonical body skeleton... */` — not full file header with callers/boundaries | Upgrade to full multi-line file header style matching `horse-page-content-skeleton.tsx` |
| `app/[locale]/profile/page.tsx:3` | Inline `/** Legacy \`/profile\` bookmark... */` — not full file header | Upgrade to full multi-line file header with what the file does, who sends users here |

### Gap 2 — Loading Skeleton Inconsistency (1 file)

| File | Issue | Fix |
|------|-------|-----|
| `app/[locale]/profile/loading.tsx` | Uses bare `<Skeleton className="h-[calc(100vh-5rem)]...">` instead of `UserPageContentSkeleton` | Replace with `UserPageContentSkeleton` (same component used by all 8 user tab loading files) |

### Gap 3 — `useRef` Non-DOM Usage (1 file)

| File | Line | Issue | Fix |
|------|------|-------|-----|
| `app/[locale]/user/[userId]/preferences/client.tsx` | 84 | `savedValuesRef = useRef<PreferencesFormValues>(emptyPreferencesFormValues)` — non-DOM ref for dirty detection across saves | Replace with `useState` |

```tsx
// Before
const savedValuesRef = useRef<PreferencesFormValues>(emptyPreferencesFormValues);

// In useEffect:
savedValuesRef.current = next;

// In discard handler:
const saved = savedValuesRef.current;

// After
const [savedValues, setSavedValues] = useState<PreferencesFormValues>(emptyPreferencesFormValues);

// In useEffect:
setSavedValues(next);

// In discard handler:
// Use savedValues directly — it's already in the closure via useCallback or use the latest value
```

### Gap 4 — Missing UI Component Tests (7 files)

| File | Coverage |
|------|----------|
| NEW: `tests/components/user/profile/profile-form.test.tsx` | Personal/Identification/Address sections rendering, Save button, dirty detection |
| NEW: `tests/components/user/preferences/preferences-form.test.tsx` | Appearance/Privacy sections, theme/language preview, Save |
| NEW: `tests/components/user/user-page-shell.test.tsx` | Auth gate, self-ownership check, loading skeleton, redirect |
| NEW: `tests/components/user/notifications/user-notification-email-section.test.tsx` | Email notification opt-ins rendering |
| NEW: `tests/components/user/workplace/user-workplace.test.tsx` | Invitations section + active list section |
| NEW: `tests/components/user/relationships/user-relationships.test.tsx` | Requests section + active list section |
| NEW: `tests/components/user/subscription/user-subscription-plan-section.test.tsx` | Plan display |

Existing test: `tests/components/user/hub/userHubContent.test.tsx` (already present)

---

## Noted — Render-Time Seed Pattern

`profile/client.tsx:92-93` uses a render-time `if (profile && seededUserId !== profile.id)` pattern to trigger `form.reset()` inside the render body. The file comments describe this as "Render-time adjustment (not an effect) — the endorsed replacement for a setState-in-effect sync." This is intentional and documented. No change needed, but flagged for awareness.

---

## Implementation Checklist

| # | Task | Category | Status |
|---|------|----------|--------|
| 1 | Upgrade `user-page-content-skeleton.tsx` header to full multi-line file header | Gap 1 — File Headers | ✅ |
| 2 | Upgrade `app/[locale]/profile/page.tsx` inline comment to full file header | Gap 1 — File Headers | ✅ |
| 3 | Replace bare `Skeleton` with `UserPageContentSkeleton` in `app/[locale]/profile/loading.tsx` | Gap 2 — Skeleton | ✅ |
| 4 | Replace `useRef` with `useState` for `savedValuesRef` in `preferences/client.tsx` | Gap 3 — useRef | ✅ |
| 5 | Create `tests/components/user/profile/profile-form.test.ts` | Gap 4 — Tests | ✅ |
| 6 | Create `tests/components/user/preferences/preferences-form.test.ts` | Gap 4 — Tests | ✅ |
| 7 | Create `tests/components/user/user-page-shell.test.ts` | Gap 4 — Tests | ✅ |
| 8 | Create `tests/components/user/notifications/user-notification-email-section.test.ts` | Gap 4 — Tests | ✅ |
| 9 | Create `tests/components/user/workplace/user-workplace.test.ts` | Gap 4 — Tests | ✅ |
| 10 | Create `tests/components/user/relationships/user-relationships.test.ts` | Gap 4 — Tests | ✅ |
| 11 | Create `tests/components/user/subscription/user-subscription-plan-section.test.ts` | Gap 4 — Tests | ✅ |
| 12 | Run `npm test` — all pass | Verification | ✅ (722/722) |
| 13 | Run `npm run lint` — no errors | Verification | ✅ (0 errors) |

---

## Completeness Gate

✅ **COMPLETE (2026-08-02):** All 13 tasks done. `npm test` (722/722), `npm run lint` (0 errors), `tsc --noEmit` (clean).

- [x] All 27 component files have proper file headers per AGENTS.md §11
- [x] All `loading.tsx` files use named `UserPageContentSkeleton` (not bare Skeleton)
- [x] Zero `useRef` in user module code (non-DOM use replaced)
- [x] UI render tests cover all tab sections
- [x] All tests pass, lint clean
