# Visibility — how to write controls

**Job:** Two-layer visibility UI pattern (shared control + entity adapter). Not keys, audiences, or PATCH paths.  
**Also open (only if needed):** horse keys/PATCH/audience → [`../engineering/horses.md`](../engineering/horses.md). User keys → [`../engineering/users.md`](../engineering/users.md) / [`../engineering/profile.md`](../engineering/profile.md). New Hub section UI → [`loading-states.md`](loading-states.md). New entity folder → [`ui-layout-naming.md`](ui-layout-naming.md).

- **Layer 1** gates whole-profile access (deny → 404). **Layer 2** gates individual Hub content blocks. They are independent — do not derive L2 from `viewerRole` / `allowedTabs`.
- **Shared control** — `SectionVisibilityControl` in the `Section` `visibilityControl` slot. Types: `lib/visibility/sectionVisibility.ts`.
- **Entity adapter** — each entity owns a thin `*SectionVisibility` wrapper that PATCHes that entity’s hub-sections endpoint. Reuse the control; do not fork it. New entity: add adapter + entity PATCH.
- **Autosave, not parent Save** — section mode changes must not mark the parent form dirty and must not wait for the tab Save.
- **Hub is display** — do not put Layer-2 popovers on Hub. Put them on the edit tab that owns those sections.
