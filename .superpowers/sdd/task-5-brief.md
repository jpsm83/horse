### Task 5: Update create-horse-form countryOfBirth to include flags

**Files:**
- Modify: `equus/components/horses/create-horse-form.tsx`

- [ ] **Step 1: Add imports** — Add the following new imports (the existing `SelectField` import should remain since it's used by other fields):
  ```tsx
  import { FlagSelectField } from "@/components/shared/flag-select-field";
  import type { FlagSelectOption } from "@/components/shared/country-options";
  ```

- [ ] **Step 2: Update countryOptions** — Change the `countryOptions` useMemo (lines 167-176) to use `getCountrySelectOptions` directly and include `flagCode`:
  ```tsx
  const countryOptions: FlagSelectOption[] = useMemo(
    () => getCountrySelectOptions(locale),
    [locale],
  );
  ```
  Note: the `{ value: "", label: tCommon("selectPlaceholder") }` empty sentinel should NOT be included — `FlagSelectField` handles empty selection through its `placeholder` prop and the `toSelectValue`/`fromSelectValue`/`selectItemValue` helpers from `@/lib/ui/selectEmptyValue.ts`.

- [ ] **Step 3: Replace `<SelectField>` for `countryOfBirth`** — Change the `<Controller>` block at lines 347-349 from `SelectField` to `FlagSelectField`:
  ```tsx
  <Controller name="countryOfBirth" control={form.control} render={({ field, fieldState }) => (
    <FlagSelectField
      id="create-horse-countryOfBirth"
      label={t("countryOfBirth")}
      placeholder={tCommon("selectPlaceholder")}
      value={field.value}
      onChange={field.onChange}
      invalid={fieldState.invalid}
      error={fieldState.error}
      options={countryOptions}
    />
  )} />
  ```

- [ ] **Step 4: Verify** — run `npx tsc --noEmit`
