### Task 1: Remove importExportStatus from model + API layer

**Files:**
- Modify: `equus/models/Horse.ts`
- Modify: `equus/lib/api/horseClient.ts`
- Modify: `equus/lib/services/horseService.ts`

- [ ] **Step 1: Remove from Mongoose schema** — open `models/Horse.ts`, delete the `importExportStatus` field (find: `importExportStatus: { type: String }` and remove the whole line)

- [ ] **Step 2: Remove from API client type** — open `lib/api/horseClient.ts`, delete `importExportStatus?: string` from `OwnerHorseSummary`

- [ ] **Step 3: Remove from service** — open `lib/services/horseService.ts`:
  - Remove `importExportStatus?: string` from `OwnerHorseSummary` type
  - Remove `importExportStatus` from the PATCH response mapping (find `importExportStatus: horse.importExportStatus`)

- [ ] **Step 4: Verify** — run `npx tsc --noEmit` to check types pass
