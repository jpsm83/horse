# Horse UI layout and naming

* **Tab folders** — section components for a horse tab live under `components/horses/<tab>/` (`admin/`, `profile/`, `connect/`, `media/`, `documents/`, `planning/`, `hub/`, `create/`, `list/`, `history/`). Chrome shared by all horseId tabs stays at `components/horses/horse-page-shell.tsx`.
* **`horse-` filename prefix** — every horse-specific component file starts with `horse-`; export name matches (e.g. `horse-visibility-section.tsx` → `HorseVisibilitySection`).
* **`components/horses/shared/`** — helpers used by two or more horse tabs only (e.g. select field adapters).
* **`components/shared/`** — only multi-module primitives (`Section`, `FileUpload`, `EntityChip`, `PendingDialog`, `SectionTitleAction`, …). Do not put horse-only UI there. **`EntityChip`** is the canonical identity card for users/horses (extend `entityHubPath` for stable, groom, etc.); callers supply title/subtitle — chip does not fetch.
* **Horse entity tables** — use `components/table` (`DataTable` + `TableUserAvatarCell` / `TableRowAction` / `TableIconAction` / `initialsFromLabel`). Admin History is the visual SoT; do not re-copy avatar/action markup. See [equus/docs/engineering/page-flow-blueprint.md](../engineering/page-flow-blueprint.md) §6.
* Canonical detail: [equus/docs/engineering/page-flow-blueprint.md](../engineering/page-flow-blueprint.md) §1 and [equus/docs/engineering/horseTabs.md](../engineering/horseTabs.md).

# User UI layout and naming

* **Tab folders** — section components for a user tab live under `components/user/<tab>/` (`hub/`, `profile/`, `preferences/`, `notifications/`, `workplace/`, `relationships/`, `subscription/`). Chrome shared by all /user/[userId] tabs: `user-layout-chrome.tsx` (layout) + `user-page-shell.tsx` (auth/self gate).
* **`user-` filename prefix** — every user-specific component file starts with `user-`; export name matches (e.g. `user-hub-content.tsx` → `UserHubContent`).
* **`components/user/shared/`** — helpers used by two or more user tabs only (e.g. `UserSectionVisibility`). Shared multi-module primitives live in `components/shared/` (see Horse section above).
* **User hub (shared)** — `UserHubContent` is used by both the owner hub tab (`/user/[userId]`, from cached `user.sections`) and the public page (`/users/[userId]`, via `useUserHub` → `GET /api/v1/users/:id/hub`). Read-only, no visibility popovers; sections are server-filtered by `buildUserHubSections`.
* Canonical detail: [equus/docs/engineering/page-flow-blueprint.md](../engineering/page-flow-blueprint.md) §12, [equus/docs/engineering/users.md](../engineering/users.md), [equus/docs/engineering/userTabs.md](../engineering/userTabs.md).
