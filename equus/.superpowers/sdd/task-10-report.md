# Task 10: Add subscription guard to ownership transfer acceptance

## Summary

Added a subscription limit check in `acceptOwnershipTransfer` for `transfer_main` transfers. When the new owner accepts a main ownership transfer, the system now verifies they have capacity under their plan before applying the ownership change.

## Changes

**File:** `lib/services/ownershipTransferService.ts`

1. **Added import** — `guardAcceptTransfer` from `@/lib/billing/subscriptionGuard.ts`
2. **Added guard check** in `acceptOwnershipTransfer()` — before calling `applyEntityOwnershipChange()`, checks if the accepting user (`actorUserId`) has room under their subscription plan for `transfer_main` transfers. If not, throws a 403 `ApiError` with the guard's message.

## Design decisions

- Guard runs only for `transfer_main` transfers. Other transfer kinds (`remove_co_owner`, `promote_co_owner`) don't transfer main ownership and don't need the check.
- The horse stays with the previous owner until the new owner accepts — the guard validates the new owner's limit at acceptance time, not at transfer creation time.
- `ApiError` was already imported in the file; no additional import needed.

## Verification

- `npx tsc --noEmit` — no new type errors
- All ownership transfer tests pass (27 tests across 5 suites)
  - `ownershipTransferService.transferMain.test.ts` — 7/7 passed
  - `ownershipTransferService.promoteCoOwner.test.ts` — 9/9 passed
  - `ownershipTransferService.removeCoOwner.test.ts` — 9/9 passed
  - `ownershipTransferService.test.ts` — 4/4 passed
  - `horseSubscriptionBilling.test.ts` — 4/4 passed
- Committed as `42cdc1d`
