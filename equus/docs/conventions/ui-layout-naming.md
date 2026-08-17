# Entity UI layout and naming

**Job:** Where entity UI files live and how they are named. Not tab lists or routes.  
**Also open (only if needed):** which shells/Save files → [`../engineering/page-flow-blueprint.md`](../engineering/page-flow-blueprint.md). Horse tab list → [`../engineering/horseTabs.md`](../engineering/horseTabs.md). User tab list → [`../engineering/userTabs.md`](../engineering/userTabs.md). Later-module types → [`../engineering/later-modules.md`](../engineering/later-modules.md). Tokens/shadcn → [`ui-styling.md`](ui-styling.md).

Applies to **every** entity folder (`components/horses/`, `components/user/`, `components/stable/`, `components/groom/`, …).

- **Tab folders** — section components for a tab live under `components/<entity>/<tab>/`. Chrome shared by that entity’s id routes stays at `components/<entity>/` (`*-layout-chrome.tsx`, `*-page-shell.tsx`, `*-page-content-skeleton.tsx`).
- **Filename prefix** — every entity-specific file starts with the entity prefix (`horse-`, `user-`, `stable-`, …). Export name matches (`horse-visibility-section.tsx` → `HorseVisibilitySection`).
- **`components/<entity>/shared/`** — helpers used by two or more tabs of **that** entity only.
- **`components/shared/`** — multi-module primitives only (`Section`, `FileUpload`, `EntityChip`, `PendingDialog`, `SectionTitleAction`, …). Do not put entity-only UI there.
- **`EntityChip`** — canonical identity card (extend `entityHubPath` for new types). Callers supply title/subtitle; the chip does not fetch.
- **Tables** — `components/table` (`DataTable`, `TableUserAvatarCell`, `TableRowAction`, `TableIconAction`, `initialsFromLabel`). Do not re-copy avatar/action markup. Which screens use tables: page-flow-blueprint.
