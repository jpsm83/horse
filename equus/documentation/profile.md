# Profile & Preferences (web UI + `PATCH /api/v1/users/me`)

Account **settings** split across two routes under `UserPageShell`:

| Route | Owns |
|-------|------|
| `/user/[userId]/profile` | Identity, address, photo, deactivate |
| `/user/[userId]/preferences` | Theme, language, profile visibility, DM audience |

Legacy `/profile` redirects to `/user/{me}/profile`. Public cards stay at `/users/[userId]`. This is **not** the signed-in landing page; after auth users land on [`/home`](./auth.md).

Related:
- [`auth.md`](./auth.md) — REST session and `fetchCurrentUser`
- [`i18n.md`](./i18n.md) — `preferredLanguage` and locale cookie sync
- [`page-flow-blueprint.md`](./page-flow-blueprint.md) — thin `page.tsx` / `loading.tsx` / `client.tsx`, deferred Save, unsaved guard
- [`../AGENTS.md`](../AGENTS.md) — web UI conventions
- [`../../documentation/userModule.md`](../../documentation/userModule.md) — `profileComplete` vs discovery visibility
- [`dataLifecycle.md`](./dataLifecycle.md) — account tombstone

---

## Routes and files

| Piece | Path |
|-------|------|
| Shell | `components/user/user-page-shell.tsx` + `components/user/user-layout-chrome.tsx` + `lib/navigation/userTabs.ts` |
| Profile route | `app/[locale]/user/[userId]/profile/{page,client,loading}.tsx` |
| Preferences route | `app/[locale]/user/[userId]/preferences/{page,client,loading}.tsx` |
| Legacy redirect | `app/[locale]/profile/page.tsx` → `/user/{id}/profile` |
| Skeleton | `components/user/user-page-content-skeleton.tsx` |
| Profile form | `app/[locale]/user/[userId]/profile/client.tsx` (parent-owned `useForm`) + `components/user/profile/user-{personal,identification,address,account-type}-section.tsx` |
| Preferences mapping | `lib/validations/preferencesForms.ts`, `lib/utils/preferencesFormMapping.ts` |
| Client fetch | `useAppAuth()` + `useUserView()` — see [`auth.md`](./auth.md) |
| API | `PATCH /api/v1/users/me` — JSON or `multipart/form-data` (avatar on profile) |

Unauthenticated users are redirected to sign-in. `userId` in the URL must match the session user (otherwise redirect to own profile).

## Profile tab — sections

The Profile tab is a deferred form (parent owns `useForm` + one Save, §6.5) composed of `<Section>` components, each wrapped in `SectionErrorBoundary`:

| Section | Content | Visibility control |
|---------|---------|--------------------|
| **Personal** | profile image, username, bio, first/last name, gender, birth date | Layer-2 `identity` popover |
| **Identification** | nationality, phone number, ID type, ID number | Layer-2 `identification` popover |
| **Address** | address fields + geocoded map | Layer-2 `address` popover |
| **Security** | password set/change (immediate) | — |
| **Account** | account type (individual/business + business details, main form) + deactivation (`ConfirmActionDialog`, immediate) | — |

Layer-1 `profileVisibility` + DM audience live on the **Preferences** tab (Privacy section). Layer-2 modes persist via `UserSectionVisibility` → `PATCH /api/v1/users/me/hub-sections`. See [`users.md`](./users.md) and [`userTabs.md`](./userTabs.md).

---

## Preferences — preview, Save, discard

One deferred RHF form (Appearance + Privacy). Theme and language **preview live** on change; cookies + DB update **only on Save**.

| Action | Behavior |
|--------|----------|
| Theme change | `applyThemeToDocument` only (no cookie) |
| Language change | `router.replace({ locale })` without `syncLocaleCookie` |
| Save | Dirty-only PATCH → `syncThemeCookie` / `syncLocaleCookie` + `form.reset` + toast; invalidate `users.me` |
| Leave dirty | `UnsavedChangesProvider` `onDiscard` restores saved theme + locale, then navigates |

Theme swatches: `themeSwatches` in `lib/theme/appTheme.ts` (hexes mirrored from `globals.css`).

---

## Profile — save flow

| Step | Behavior |
|------|----------|
| Submit | React Hook Form + `profileForms.ts` (client Zod) |
| Dirty fields only | `mapProfileFormValuesToPatch` |
| No changes | `toast.info(profile.noChanges)` |
| Has changes | `LoadingOverlay`, then `PATCH` |
| Success | Reset form from saved user, toast |

Language/theme/privacy are **not** on the profile form.

---

## Visibility preferences

Edited on **Preferences**. `PATCH /api/v1/users/me` persists:

- `preferences.profileVisibility`: `public` | `platform` | `relationships` | `private`
- `preferences.allowDirectMessagesFrom`: `everyone` | `relationships` | `nobody`

**Public read:** `GET /api/v1/users/:id` via `getPublicUserForRequester`. Web page: `/users/[userId]`.

---

## Clearing optional fields

| Layer | Rule |
|-------|------|
| Client (`profileForms.ts`) | Empty strings allowed on optional fields; trim on validate |
| PATCH body (`profileFormMapping.ts`) | Only **dirty** fields; cleared optionals sent as `""` |
| API (`lib/validations/user.ts`) | Omitted = no change; `""` = clear |
| Service (`userService.updatePersonalDetails`) | `""` / `null` → MongoDB **`$unset`** |

---

## Avatar upload

Multipart: `profile` JSON (dirty fields) + `image` file. See `lib/utils/parseProfileFormData.ts`.

---

## Address map

`ProfileAddressMap` via `next/dynamic({ ssr: false })`. Geocoding uses Nominatim.

---

## `profileComplete` banner

When `user.profileComplete` is false:

| Location | Behavior |
|----------|----------|
| **`AppShell`** (except account profile/preferences) | `IncompleteProfileBanner` → `/user/{id}/profile` |
| **`/user/.../profile`** | Inline `Alert`; global banner hidden via `isAccountSettingsPath` |

---

## Account deactivation (not hard delete)

| Step | Behavior |
|------|----------|
| Web UI | Profile tab → deactivate (`profile-deactivate-account.tsx`) |
| Client | `DELETE /api/v1/users/me` → clear auth → `/signin` |
| Data | Soft tombstone; document retained |

Full policy: [`dataLifecycle.md`](../../documentation/dataLifecycle.md).
