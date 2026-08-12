# Horse Profile: Country of Birth Dropdown & Import/Export Status Cleanup

## Summary

Two changes to the horse profile system:
1. Replace free-text `countryOfBirth` with a required country-select dropdown with flags (using existing `FlagSelectField` in `components/shared/`)
2. Delete the unused `importExportStatus` field from model, validations, UI, i18n, and all supporting code

## Changes

### Part 1: Country of Birth → FlagSelectField (required)

| File | Change |
|------|--------|
| `components/horses/profile/identity-section.tsx` | Replace `<TextField name="countryOfBirth">` with `<FlagSelectField>`; generate `countryOptions` via `getCountrySelectOptions(locale)` |
| `components/horses/create-horse-form.tsx` | Change `<SelectField>` to `FlagSelectField`; include `flagCode` in mapped options |
| `lib/validations/horseForms.ts` | Make `countryOfBirth` required; validate against `isValidCountryCode` |
| `lib/validations/horse.ts` | Make `countryOfBirth` required; validate against `isValidCountryCode` |
| `lib/utils/horseFormMapping.ts` | Remove empty fallback for `countryOfBirth` |
| `lib/utils/horseProfilePatch.ts` | Ensure required field always present |

### Part 2: Delete importExportStatus

| File | Change |
|------|--------|
| `models/Horse.ts` | Remove `importExportStatus` field |
| `lib/api/horseClient.ts` | Remove from `OwnerHorseSummary` |
| `lib/services/horseService.ts` | Remove from type, service usage, response mapping |
| `lib/validations/horseForms.ts` | Remove field from schemas + defaults |
| `lib/validations/horse.ts` | Remove field from schemas |
| `lib/utils/horseFormMapping.ts` | Remove field from mapping |
| `lib/utils/horseProfilePatch.ts` | Remove from defaults, `toProfileFormValues`, `buildProfileSavePatches` |
| `components/horses/create-horse-form.tsx` | Remove field from form UI |
| `components/horses/profile/identity-section.tsx` | Remove field from form UI |
| `messages/en.json` | Remove translation keys |
| `messages/es.json` | Remove translation keys |

## Validation

- `countryOfBirth`: required, must be valid ISO alpha-2 code (via `isValidCountryCode` from `lib/data/countries.ts`)
- No migration needed — orphaned `importExportStatus` values in existing docs are ignored by Mongoose
