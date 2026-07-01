# Profile page (web UI + `PATCH /api/v1/users/me`)

Account **settings** — personal details, preferences, language, and deactivation. This is **not** the signed-in landing page; after auth users land on [`/home`](./auth.md) (user home hub). Use `/profile` when editing account data.

How the authenticated user edits `personalDetails`, including loading UX, save flow, and clear-field semantics.

Related:
- [`auth.md`](./auth.md) — REST session and `fetchCurrentUser`
- [`i18n.md`](./i18n.md) — `preferredLanguage` and locale cookie sync
- [`horses.md`](./horses.md) — horse discovery/contact visibility layer
- [`stables.md`](./stables.md) — stable discovery visibility layer
- [`breeders.md`](./breeders.md) — breeder discovery visibility layer
- [`transports.md`](./transports.md) — transport discovery visibility layer
- [`trainers.md`](./trainers.md) — trainer discovery visibility layer
- [`grooms.md`](./grooms.md) — groom discovery visibility layer
- [`coaches.md`](./coaches.md) — coach discovery visibility layer
- [`farriers.md`](./farriers.md) — farrier discovery visibility layer
- [`riders.md`](./riders.md) — rider discovery visibility layer
- [`veterinaries.md`](./veterinaries.md) — veterinary discovery visibility layer
- [`../AGENTS.md`](../AGENTS.md) — web UI conventions (forms, toasts, loading)
- [`../../documentation/userModule.md`](../../documentation/userModule.md) — `profileComplete` vs discovery visibility
- [`../../documentation/dataLifecycle.md`](../../documentation/dataLifecycle.md) — no hard deletes; account tombstone
- [`dataLifecycle.md`](./dataLifecycle.md) — engineering reference

---

## Route and files

| Piece | Path |
|-------|------|
| Route | `app/[locale]/profile/page.tsx` — `Suspense` + `ProfilePageSkeleton` fallback |
| Route loading | `app/[locale]/profile/loading.tsx` — skeleton during navigations |
| Page shell | `components/profile/profile-page.tsx` → `ProfilePageContent` |
| Data load | `components/profile/profile-page-content.tsx` — `useEffect` + skeleton until REST data arrives |
| Skeleton | `components/profile/profile-page-skeleton.tsx` — mirrors `profile-form.tsx` layout ([shadcn Skeleton](https://ui.shadcn.com/docs/components/radix/skeleton)) |
| Form | `components/profile/profile-form.tsx` |
| Client fetch | `lib/profile/loadProfilePageData.ts` — `fetchCurrentUser` + `fetchUserProfile` |
| API | `PATCH /api/v1/users/me` — JSON or `multipart/form-data` (avatar) |

---

## Loading UX (Suspense + skeleton)

Every app page should use **Suspense** and a **skeleton** that matches the real layout. Profile is the reference implementation.

1. **`loading.tsx`** — Next.js shows `ProfilePageSkeleton` while the route segment loads.
2. **`page.tsx` `Suspense`** — same skeleton as fallback around `ProfilePage`.
3. **`ProfilePageContent`** — after mount, calls `createProfilePageDataPromise()` and shows `ProfilePageSkeleton` until data is ready.

**Why not `use()` on the fetch promise?** Profile auth uses browser `credentials: "include"`. Running that fetch during SSR (or hydrating a server-created promise) fails without cookies and can leave Suspense stuck on the skeleton. Client-only load via `useEffect` is intentional until profile data is fetched on the server with `cookies()` in a Server Component.

Unauthenticated users are redirected to `/signin?next=%2Fprofile`.

---

## Save flow (web form)

| Step | Behavior |
|------|----------|
| Submit | React Hook Form + `profileForms.ts` (client Zod) |
| Dirty fields only | `mapProfileFormValuesToPatch` sends only fields in `dirtyFields` |
| No changes | `toast.info(profile.noChanges)` — no API call |
| Has changes | `LoadingOverlay` on the page (`aria-busy`), submit disabled, then `PATCH` |
| Success | Reset form from saved user, sync locale if `preferredLanguage` changed, `toast.success` **after** overlay clears |
| Error | `toast.error` after overlay clears |

Use `useAppToast()` — includes `info` for no-op saves. Do not use an `Alert` for page-level loading; use the skeleton or overlay.

---

## Visibility preferences

`PATCH /api/v1/users/me` also persists `User.preferences` from the profile form:

- `preferences.profileVisibility`: `public` | `platform` | `relationships` | `private` — who can see personal fields when viewing the user profile page (entity-linked only; users are never searchable)
- `preferences.allowDirectMessagesFrom`: `everyone` | `relationships` | `nobody`

These are user-level controls and do not replace horse-level discovery (`Horse.profileVisibility`, `Horse.contactDisplay`) or role-profile `isPublic` on listings.

**Public read:** `GET /api/v1/users/:id` returns a filtered profile card via `getPublicUserForRequester` (`lib/privacy/userPublicProfile.ts`). Auth is optional (Bearer or cookie); blocked audiences receive `404 NOT_FOUND`. Full account data remains on `GET /api/v1/users/me`. Product spec: [`documentation/userModule.md`](../../documentation/userModule.md) §3 U-PRIV-05.

**Web page:** `/users/[userId]` (locale-prefixed) loads the card via `lib/api/userClient.ts` after client mount. Deep-linked from entity owner links only — not listed in discover navigation.

**Tests:** U-PRIV-01 matrix coverage in `tests/lib/privacy/userPublicProfile.visibilityMatrix.test.ts` and `tests/app/api/v1/users/[id]/route.get.test.ts`.

---

## Clearing optional fields

Optional profile fields can be cleared in the UI (empty input).

| Layer | Rule |
|-------|------|
| Client (`profileForms.ts`) | Empty strings allowed on optional fields; trim on validate |
| PATCH body (`profileFormMapping.ts`) | Only **dirty** fields; cleared optionals sent as `""` |
| API (`lib/validations/user.ts`) | Omitted = no change; `""` = clear |
| Service (`userService.updatePersonalDetails`) | `""` / `null` → MongoDB **`$unset`** (field absent in DB, not stored as `null` or `"null"`) |
| API response (`toPublicUser`) | `omitNullishFields` — unset fields omitted from JSON |

Address subfields are individually optional on PATCH so partial clears (e.g. only `doorNumber`) validate correctly.

---

## Avatar upload

When the user selects a new photo, the client sends **`multipart/form-data`** with:

- `profile` — JSON string of the same PATCH payload (dirty fields only)
- `image` — file blob

`lib/utils/parseProfileFormData.ts` parses the `profile` field. Do not append individual form keys as strings (avoids `"null"` for cleared values).

---

## Address map

`ProfileAddressMap` is loaded with `next/dynamic({ ssr: false })` (Leaflet). The form shows a map skeleton with the same dimensions until the chunk loads. Geocoding uses Nominatim; set `NEXT_PUBLIC_NOMINATIM_CONTACT_EMAIL` in production.

---

## `profileComplete` banner

When `user.profileComplete` is false:

| Location | Behavior |
|----------|----------|
| **`AppShell`** (all locale pages except `/profile`) | `IncompleteProfileBanner` below the header — link to `/profile` (`profile.incompleteGlobalBannerLink`) |
| **`/profile`** | Inline `Alert` above the form (`profile.incompleteBanner`) — duplicate global banner suppressed via `shouldShowIncompleteProfileBanner` |

Required fields for completion are defined in `lib/auth/session.ts` (`isProfileComplete`). `profileComplete` on the session comes from `GET /api/v1/auth/me` / access token payload (`buildAuthUserSessionFromUserId`).

---

## Account deactivation (not hard delete)

`DELETE /api/v1/users/me` **deactivates** the account — it does not remove the `User` document.

| Step | Behavior |
|------|----------|
| Web UI | `/profile` → Account → confirm dialog (`profile-deactivate-account.tsx`) |
| Client | `deactivateCurrentUserAccount()` → `DELETE /api/v1/users/me`; clears auth cache; NextAuth `signOut`; redirect `/signin` |
| API | `userService.softDelete` → `isActive: false`, `deactivatedAt`, `deactivatedByUserId` (self), `refreshSessionVersion` bump |
| Response | `authService.logout` clears httpOnly REST cookies (same as logout) |
| Data | Document retained for horses, relationships, invoices, and audit refs |

Product UI (UA-10) uses **Deactivate account** on `/profile` (`components/profile/profile-deactivate-account.tsx`): confirm dialog → `deactivateCurrentUserAccount` → sign-in redirect. Hiding personal fields without closing login uses `preferences.profileVisibility` — see [Visibility preferences](#visibility-preferences).

Full policy: [`dataLifecycle.md`](../../documentation/dataLifecycle.md) (product) and [`equus/documentation/dataLifecycle.md`](./dataLifecycle.md) (engineering).

**PII erasure (GDPR):** separate from deactivation — `userService.anonymizeUserPii` after `softDelete`. No public API yet. See [`piiAnonymization.md`](./piiAnonymization.md).
