# Task 5: Create `lib/billing/horseCounter.ts`

## Summary

Created `lib/billing/horseCounter.ts` with three exported functions:

- **`countUserOwnedHorses(userId)`** — counts active horses owned by a user
- **`getUserHorseUsage(userId)`** — returns current count, plan limit, tier, and remaining slots
- **`canUserAddHorse(userId)`** — checks if user can add a horse; if not, suggests the required tier

## Type check

Ran `npx tsc --noEmit`. No errors from the new file. Pre-existing errors in test files unrelated to this change.

## Commit

`8e02b65` — `feat(billing): add horseCounter service`
