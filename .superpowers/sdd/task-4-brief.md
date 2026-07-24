### Task 4: Replace countryOfBirth with FlagSelectField in profile identity section

**Files:**
- Modify: `equus/components/horses/profile/identity-section.tsx`

- [ ] **Step 1: Add imports** at top of identity-section.tsx:
  - Add `import { FlagSelectField } from "@/components/shared/flag-select-field"`
  - Add `import { getCountrySelectOptions } from "@/components/shared/country-options"`
  - Add `import { useLocale } from "next-intl"` (if not already imported)
  - Add `import { Controller } from "react-hook-form"` (if not already imported — currently imported as `{ Controller, type Control }`)

- [ ] **Step 2: Add countryOptions computation** inside the IdentitySection component:
  ```tsx
  const currentLocale = useLocale();
  const countryOptions = useMemo(() => getCountrySelectOptions(currentLocale), [currentLocale]);
  ```

- [ ] **Step 3: Replace the `<TextField>` for `countryOfBirth`** (lines 120-125) with a `<Controller>` + `<FlagSelectField>`:
  ```tsx
  <Controller
    name="countryOfBirth"
    control={control}
    render={({ field, fieldState }) => (
      <FlagSelectField
        id="profile-countryOfBirth"
        label={t("countryOfBirth")}
        placeholder={tCommon("selectPlaceholder")}
        value={field.value}
        onChange={field.onChange}
        invalid={fieldState.invalid}
        error={fieldState.error}
        options={countryOptions}
      />
    )}
  />
  ```

- [ ] **Step 4: Verify** — run `npx tsc --noEmit`
