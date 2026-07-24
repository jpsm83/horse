# Task 1 Report: Remove importExportStatus from model + API layer

## What was implemented
Removed `importExportStatus` from the Mongoose schema, API client types, and service layer as specified. Also fixed a downstream type error in `horseProfilePatch.ts`.

## Files changed
- `equus/models/Horse.ts` — removed `importExportStatus: { type: String }` from schema (line 72)
- `equus/lib/api/horseClient.ts` — removed `importExportStatus?: string` from `OwnerHorseSummary` type
- `equus/lib/services/horseService.ts` — removed `importExportStatus` from `OwnerHorseHubSummary` type, from `createHorse()` payload mapping, and from `getOwnerHorseHubSummary()` response mapping
- `equus/lib/utils/horseProfilePatch.ts` — removed `importExportStatus` from `toProfileFormValues()` mapping (caused TS error after `OwnerHorseSummary` type change); kept default `importExportStatus: ""` in return value because `ProfileFormValues` still requires the field (will be removed in later task)

## What was tested
- `npx tsc --noEmit` — no new type errors introduced by this change
- All pre-existing errors unrelated (table components, profile form mapping, test type mismatches)

## Self-review findings
- Clean removal — all three target files modified as specified
- No other code references `importExportStatus` that would cause runtime errors
- Remaining references exist in validations, UI, i18n, and docs — deferred to later tasks per plan

## Issues or concerns
- `horseProfilePatch.ts` has a bridge default (`importExportStatus: ""`) that will need removal when the validation layer is updated in a later task
- Pre-existing uncommitted changes in the working tree (competition results feature work) — these are not part of this task
