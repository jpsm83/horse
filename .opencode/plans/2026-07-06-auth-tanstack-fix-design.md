# Fix Google OAuth Regression After TanStack Query Migration

**Date**: 2026-07-06

## Context

Google sign-in broke after introducing TanStack Query hooks. The `useCurrentUser` hook created a second code path to `/api/v1/auth/me` with an independent token refresh tracker, racing with `authClient.ts`'s session bridge.

## Root Cause

Two competing auth state systems with separate `refreshInFlight` variables:

- `authClient.ts` — owns REST session via `apiFetch` + `refreshInFlight`
- `fetchWithAuth.ts` — owns TanStack Query fetch via `fetchWithAuth` + its own `refreshInFlight`

During Google OAuth redirect → `/home`, both fire `GET /api/v1/auth/me` simultaneously through different refresh trackers, causing race conditions that prevent the REST session bridge from completing.

## Design

### Principle

Auth state is **context**, not async server state. TanStack Query handles async server data (horses, stables, invites, etc.). `authClient.ts` owns auth session state via in-memory cache + observer pattern, consumed by `useAppAuth()`.

`/api/v1/auth/me` is called ONCE by `authClient.ts` during session establishment. TanStack Query hooks read from `useAppAuth()` — no duplicate HTTP call.

### Part A — Remove TanStack Query from auth state

| File | Change |
|------|--------|
| `lib/api/authClient.ts` | Export `refreshAccessToken` function |
| `lib/api/fetchWithAuth.ts` | Import `refreshAccessToken` from `authClient`; remove own `refreshInFlight` and duplicate implementation |
| `hooks/queries/useCurrentUser.ts` | Remove `useCurrentUser` TanStack Query hook; `useInvalidateCurrentUser` calls `resetOptionalUserCache()` + TanStack invalidation for non-auth keys |
| `components/horses/horse-hub-page-content.tsx` | Replace `useCurrentUser()` with `useAppAuth()` — `!isAuthenticated` check instead of auth error handling |
| `lib/api/queryKeys.ts` | Remove unused `auth.me` key |

### Part B — Token refresh coordination

Both `authClient.ts` and `fetchWithAuth.ts` share a single `refreshInFlight`:

```
fetchWithAuth → 401 → authClient.refreshAccessToken() → shared refreshInFlight
                         ↓
                   authClient.apiFetch also uses same refreshInFlight
```

### Security

`optionalUserCache` stores `AuthUser` profile data (id, email, authProvider) — not tokens. The actual auth tokens are in httpOnly cookies, inaccessible from JavaScript. This is the same pattern as NextAuth's own `SessionProvider` in-memory cache.

### Verification

- Google sign-in completes end-to-end (account chooser → callback → `/home` shows authenticated state)
- Credentials sign-in still works
- TanStack Query hooks still work for non-auth endpoints
- Token refresh works from both code paths without races
- Unit tests pass (`npm test`)

## Affected Files

### Modified
- `lib/api/authClient.ts` — export `refreshAccessToken`
- `lib/api/fetchWithAuth.ts` — import shared refresh
- `hooks/queries/useCurrentUser.ts` — remove `useCurrentUser`, refactor `useInvalidateCurrentUser`
- `components/horses/horse-hub-page-content.tsx` — switch to `useAppAuth()`
- `lib/api/queryKeys.ts` — remove `auth.me`

### No changes needed
- `lib/auth/auth.ts` — NextAuth config is correct
- `app/api/v1/auth/session/route.ts` — bridge route is correct
- `components/providers/app-auth-provider.tsx` — auth provider is correct
- `components/providers/auth-session-provider.tsx` — session handler is correct
