# Task 4: Update Horse model — registration embed with lifecycle + payment gating

## Summary

Replaced `horseSubscriptionSchema` with `horseRegistrationSchema` across the codebase.

## Changes

### `utils/enums.ts`
- Removed `horseSubscriptionStatusEnums` (only used by `horseSubscriptionSchema`)

### `models/Horse.ts`
- Removed `horseSubscriptionStatusEnums` from enum destructuring
- Replaced `horseSubscriptionSchema` (status, monthlyFee, currency, trial/cancel dates, payerUserId, commission tracking) with `horseRegistrationSchema` (addedAt, isActive, dateOfDeath, dataAvailability enum, payerUserId, commission tracking)
- Renamed schema field from `subscription` to `registration`
- Updated indexes from `subscription.status` → `registration.isActive` and `subscription.referralReference` → `registration.referralReference`

### `lib/services/horseService.ts`
- Updated `createHorse` to emit `registration: { payerUserId: actorUserId }` instead of old subscription fields

### `lib/horses/horseSubscriptionBilling.ts`
- Updated `$set` paths from `subscription.payerUserId` → `registration.payerUserId`
- Updated variable name and type cast from `subscription` → `registration`

### Tests
- Updated all test assertions and fixtures from `subscription` to `registration` across 4 test files

## Verification
- `npx tsc --noEmit` — no new errors (only pre-existing test type errors)
- `npx vitest run` on affected test files — all 25 tests pass
- Commit: `cc6bd38`
