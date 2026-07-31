# Horse Tab Visibility for Unauthenticated/Unrelated Users

## Problem

When no user is logged in (or a user without a relationship to a horse) navigates to a horse page:

1. The tab bar initially shows tabs the user should not see (planning, media, documents) because `TAB_MIN_ROLE` sets their minimum role to `"guest"`.
2. The `getHorseTabs` fallback path (when `allowedTabs` is undefined during loading) also shows tabs that should be restricted.

## Root Cause

`lib/services/horseService.ts` defines `TAB_MIN_ROLE`:

```
hub: "guest"
planning: "guest"    ← incorrect, should be "related"
media: "guest"       ← incorrect, should be "related"
documents: "guest"   ← incorrect, should be "related"
connect: "responsible"
profile: "responsible"
history: "responsible"
admin: "main_owner"
```

This means `guest` (unauthenticated) and `public` (authenticated, no relation) can see planning/media/documents — they should only see `hub`.

The `getHorseTabs` fallback in `lib/navigation/horseTabs.ts` repeats the same mistake during the loading phase.

## Solution

### 1. Fix `TAB_MIN_ROLE` — change planning/media/documents from `"guest"` to `"related"`

Role hierarchy: `guest < public < related < responsible < co_owner < main_owner`

- **guest** (unauthenticated): hub only
- **public** (authenticated, no relationship): hub only
- **related** (has accepted relationship): hub + planning + media + documents
- **responsible+** (ownership team): all tabs
- **main_owner**: all tabs (including admin)

### 2. Fix `getHorseTabs` fallback — hub-only fallback

When `allowedTabs` is undefined (loading/cache miss), return only `[hub]` as the safest default instead of the current 4-tab fallback.

### Behavior after fix

`EntityTabs` already returns `null` when `visibleTabs.length <= 1`. With only hub visible for guest/public users, the entire tab bar hides — giving more screen space as desired.

## Files Changed

| File | Change |
|------|--------|
| `lib/services/horseService.ts` | `TAB_MIN_ROLE`: planning/media/documents → `"related"` |
| `lib/navigation/horseTabs.ts` | `getHorseTabs` fallback → hub-only when `allowedTabs` is undefined |
| `tests/lib/services/horseService.test.ts` | Add tests for `deriveAllowedTabs` |
