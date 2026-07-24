### Task 6: Make countryOfBirth required in validations

**Files:**
- Modify: `equus/lib/validations/horseForms.ts`
- Modify: `equus/lib/validations/horse.ts`
- Modify: `equus/lib/utils/horseProfilePatch.ts`

- [ ] **Step 1: Update client validation** — in `lib/validations/horseForms.ts`:
  - Import `isValidCountryCode` from `@/lib/data/countries`
  - In `createHorseFormSchema` (line 166): change `countryOfBirth: optionalTrimmedString(100)` to `countryOfBirth: z.string().refine((v) => isValidCountryCode(v), { message: "Invalid country code" })`
  - In `identityFormSchema` (line 261): same change
  - Keep the default value `countryOfBirth: ""` in `emptyCreateHorseFormValues` (form needs an initial value; validation will require it)

- [ ] **Step 2: Update server validation** — in `lib/validations/horse.ts`:
  - Import `isValidCountryCode` from `@/lib/data/countries`
  - In `createHorseSchema` (line 82): change `countryOfBirth: z.string().trim().max(100).optional()` to `countryOfBirth: z.string().refine((v) => isValidCountryCode(v), { message: "Invalid country code" })`
  - In `updateHorseProfileSchema` (line 122): keep it as optional (PATCH can omit the field; only validate if present). Update it to: `countryOfBirth: z.string().refine((v) => isValidCountryCode(v), { message: "Invalid country code" }).optional()`

- [ ] **Step 3: Update profile patch** — in `lib/utils/horseProfilePatch.ts`:
  - Line 175: change `countryOfBirth: buildOptionalStringPatch(dirty, "countryOfBirth", values.countryOfBirth)` to `countryOfBirth: buildStringPatch(dirty, "countryOfBirth", values.countryOfBirth)` (consistent with other required fields like name, breed, sex)

- [ ] **Step 4: Verify** — run `npx tsc --noEmit`
