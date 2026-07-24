### Task 2: Remove importExportStatus from validations + utils

**Files:**
- Modify: `equus/lib/validations/horseForms.ts`
- Modify: `equus/lib/validations/horse.ts`
- Modify: `equus/lib/utils/horseFormMapping.ts`
- Modify: `equus/lib/utils/horseProfilePatch.ts`

- [ ] **Step 1: Remove from client validations** — open `lib/validations/horseForms.ts`:
  - Remove `importExportStatus: optionalTrimmedString(100)` from `createHorseFormSchema`
  - Remove `importExportStatus: optionalTrimmedString(100)` from `profileFormSchemas().identityFormSchema`
  - Remove `importExportStatus: ""` from the empty defaults

- [ ] **Step 2: Remove from server validations** — open `lib/validations/horse.ts`:
  - Remove `importExportStatus: z.string().trim().max(100).optional()` from `createHorseSchema`
  - Remove `importExportStatus: z.string().trim().max(100).optional()` from `updateHorseProfileSchema`

- [ ] **Step 3: Remove from form mapping** — open `lib/utils/horseFormMapping.ts`, remove the lines mapping `importExportStatus`

- [ ] **Step 4: Remove from profile patch utils** — open `lib/utils/horseProfilePatch.ts`:
  - Remove `importExportStatus: ""` from `emptyProfileFormValues`
  - Remove `importExportStatus: horse.importExportStatus ?? ""` from `toProfileFormValues`
  - Remove the `buildOptionalStringPatch("importExportStatus")` call from `buildProfileSavePatches`

- [ ] **Step 5: Verify** — run `npx tsc --noEmit`
