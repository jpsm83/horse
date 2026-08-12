# Horse Profile: Country of Birth Dropdown & Import/Export Cleanup — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace free-text `countryOfBirth` with required flag-enabled dropdown; delete `importExportStatus` entirely.

**Architecture:** Use existing `FlagSelectField` from `components/shared/flag-select-field.tsx` and `getCountrySelectOptions` from `components/shared/country-options.ts`. Remove `importExportStatus` field across all layers (model, validations, services, UI, i18n).

**Tech Stack:** Next.js 16, React 19, Mongoose, shadcn/ui, react-hook-form + @hookform/resolvers/zod, next-intl

---

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

---

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

---

### Task 3: Remove importExportStatus from UI + i18n

**Files:**
- Modify: `equus/components/horses/profile/identity-section.tsx`
- Modify: `equus/components/horses/create-horse-form.tsx`
- Modify: `equus/messages/en.json`
- Modify: `equus/messages/es.json`

- [ ] **Step 1: Remove from identity-section.tsx** — remove the `<FormField>` block for `importExportStatus` (the `<TextField>` with `label="Import/export status"` and its `FormLabel`)

- [ ] **Step 2: Remove from create-horse-form.tsx** — remove the `<FormField>` block for `importExportStatus`

- [ ] **Step 3: Remove from en.json** — find and remove the `"importExportStatus"` translation keys:
  - Under `"Horses.form.importExportStatus"` in the horses section
  - Any other key referencing importExportStatus

- [ ] **Step 4: Remove from es.json** — same as en.json but Spanish

- [ ] **Step 5: Verify** — run `npx tsc --noEmit`

---

### Task 4: Replace countryOfBirth with FlagSelectField in profile identity section

**Files:**
- Modify: `equus/components/horses/profile/identity-section.tsx`

- [ ] **Step 1: Add imports** at top of identity-section.tsx:
  - `import { FlagSelectField } from "@/components/shared/flag-select-field"`
  - `import { getCountrySelectOptions } from "@/components/shared/country-options"`

- [ ] **Step 2: Add countryOptions computation** inside the component (same pattern as profile-form.tsx):
  ```tsx
  const currentLocale = useLocale();
  const countryOptions = useMemo(() => getCountrySelectOptions(currentLocale), [currentLocale]);
  ```

- [ ] **Step 3: Replace the `<FormField>` for `countryOfBirth`** — replace the plain `<TextField>` block with:
  ```tsx
  <FormField
    control={control}
    name="countryOfBirth"
    render={({ field }) => (
      <FormItem>
        <FormLabel>{t("countryOfBirth")}</FormLabel>
        <FormControl>
          <FlagSelectField
            options={countryOptions}
            placeholder={t("selectCountry")}
            value={field.value}
            onValueChange={field.onChange}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
  ```

- [ ] **Step 4: Verify** — run `npx tsc --noEmit`

---

### Task 5: Update create-horse-form countryOfBirth to include flags

**Files:**
- Modify: `equus/components/horses/create-horse-form.tsx`

- [ ] **Step 1: Update country options mapping** — change the options building to include `flagCode`:
  ```tsx
  const countryOptions: FlagSelectOption[] = useMemo(
    () => getCountryOptions(currentLocale).map((c) => ({
      value: c.value,
      label: c.label,
      flagCode: c.value,
    })),
    [currentLocale],
  );
  ```
  Note: import `FlagSelectOption` from `@/components/shared/country-options`

- [ ] **Step 2: Replace `<SelectField>` with `<FlagSelectField>`** — change the countryOfBirth field:
  ```tsx
  import { FlagSelectField } from "@/components/shared/flag-select-field";
  ```
  And replace the `<FormField>` render to use `<FlagSelectField>` with `options={countryOptions}`

- [ ] **Step 3: Verify** — run `npx tsc --noEmit`

---

### Task 6: Make countryOfBirth required in validations

**Files:**
- Modify: `equus/lib/validations/horseForms.ts`
- Modify: `equus/lib/validations/horse.ts`

- [ ] **Step 1: Update client validation** — in `lib/validations/horseForms.ts`:
  - In `createHorseFormSchema`: change `countryOfBirth` from `optionalTrimmedString(100)` to `z.string().refine((v) => isValidCountryCode(v), { message: "Invalid country code" })`
  - In `profileFormSchemas().identityFormSchema`: same change
  - Import `isValidCountryCode` from `@/lib/data/countries`
  - Ensure default value `countryOfBirth: ""` is removed or changed to not be empty

- [ ] **Step 2: Update server validation** — in `lib/validations/horse.ts`:
  - In `createHorseSchema`: change `countryOfBirth` to `z.string().refine((v) => isValidCountryCode(v), { message: "Invalid country code" })`
  - In `updateHorseProfileSchema`: same change
  - Import `isValidCountryCode` from `@/lib/data/countries`

- [ ] **Step 3: Update defaults** — in `lib/utils/horseProfilePatch.ts`, change `countryOfBirth: ""` to requiring a valid value

- [ ] **Step 4: Verify** — run `npx tsc --noEmit`

---

### Task 7: Final verification

- [ ] **Step 1: Type check** — `npx tsc --noEmit` — must pass with no errors

- [ ] **Step 2: Lint** — run lint command (check package.json for lint script): no errors

- [ ] **Step 3: Build** — `npm run build` or equivalent — must succeed
