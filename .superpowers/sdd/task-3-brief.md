### Task 3: Remove importExportStatus from i18n

**Files:**
- Modify: `equus/messages/en.json`
- Modify: `equus/messages/es.json`

**Note:** The UI components (identity-section.tsx, create-horse-form.tsx) were already cleaned up in Task 2. This task only needs to remove the `importExportStatus` translation keys from i18n JSON files.

- [ ] **Step 1: Remove from en.json** — find and remove the `"importExportStatus"` translation keys:
  - Under `"Horses.form.importExportStatus"` in the horses section
  - Any other key referencing importExportStatus

- [ ] **Step 2: Remove from es.json** — same as en.json but Spanish

- [ ] **Step 3: Verify** — run `npx tsc --noEmit` (JSON changes won't affect types, but verify no regressions)
