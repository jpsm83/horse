# User Tabs

## Current Tab Structure

| Tab | Route | Purpose |
|-----|-------|---------|
| Hub | `/user/[userId]` | Owner read-only hub — same structure as the public `/users/[userId]` hub. Sections: identity / about / contact / entities. No visibility popovers. |
| Profile | `/user/[userId]/profile` | Deferred form split into sections: **Personal** (image, username, bio, name, gender, birth date), **Identification** (nationality, phone, ID type, ID number), **Address** — each with its own Layer-2 visibility popover. **Security** (password) + **Account** (account type + deactivation). |
| Preferences | `/user/[userId]/preferences` | Deferred form: appearance (theme) + privacy (`profileVisibility`, DM audience). Live preview; Save persists. |
| Notifications | `/user/[userId]/notifications` | Email notification opt-ins. |
| Workplace | `/user/[userId]/workplace` | Workplace invitations + active collaborations. |
| Relationships | `/user/[userId]/relationships` | Relationship requests + active connections. |
| Subscription | `/user/[userId]/subscription` | Current plan. |

## Layout and chrome

```
app/[locale]/user/[userId]/
  layout.tsx    ← UserLayoutChrome only (no service prefetch)
  page.tsx      ← thin Server Component (generateMetadata + HubContent)
  client.tsx    ← hub tab (UserPageShell + UserHubContent)
  loading.tsx   ← UserPageContentSkeleton
  <tab>/{page,client,loading}.tsx
```

- **`UserLayoutChrome`** (in `layout.tsx`) renders `EntityTabs` (`getUserTabs`) + `UnsavedChangesProvider` + content wrapper — tabs persist across route transitions.
- **`UserPageShell`** gates auth + self-ownership per tab; shows `UserPageContentSkeleton` while loading.
- `loading.tsx` and `UserPageShell` share the same `UserPageContentSkeleton` (no SSR→client swap).
- All data sections use `Section` + `SectionErrorBoundary`.

## User hub — shared with the public page

The owner hub tab and `/users/[userId]` render the **same** `UserHubContent`:

- **Owner** — reads `useUserView` → `GET /api/v1/users/:id/view`.
- **Public** — `useUserHub` → `GET /api/v1/users/:id/hub` (audience-filtered by L1 + L2).
- Sections are server-filtered (`buildUserHubSections`); no visibility popovers on the hub.

## Visibility

| Control | Layer | Where |
|---------|-------|-------|
| `preferences.profileVisibility` (public/platform/relationships/private) | L1 | Preferences tab — Privacy section |
| `preferences.allowDirectMessagesFrom` | privacy | Preferences tab — Privacy section |
| `hubSections.identity` mode | L2 | Profile tab — Personal section popover |
| `hubSections.identification` mode | L2 | Profile tab — Identification section popover |
| `hubSections.address` mode | L2 | Profile tab — Address section popover |

Hub-facing keys: `identity` | `identification` | `address` | `contact` | `entities`. `UserSectionVisibility` adapter → `PATCH /api/v1/users/me/hub-sections`. No centralized visibility table — each section owns its popover.

## Component layout

- Tab components live under `components/user/<tab>/` with a `user-` filename prefix and matching PascalCase export.
- Cross-tab user helpers: `components/user/shared/` (`UserSectionVisibility`).
- App-wide primitives: `components/shared/` (`Section`, `SectionErrorBoundary`, `EntityChip`, …).

## Deferred form tabs (Profile, Preferences)

Both use a parent-owned `useForm` + single Save, dirty → `useUnsavedChanges` guard (tab navigation intercepted by `EntityTabs`). Field sections receive `control` only. Layer-2 visibility popovers sit on the section headers (autosave, not part of the form). Immediate-action sections (security, account deactivation) keep their own mutations. Canonical rules: [`page-flow-blueprint.md`](page-flow-blueprint.md) §6.5.
