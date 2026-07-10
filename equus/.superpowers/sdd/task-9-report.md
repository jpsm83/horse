# Task 9 Report: Add subscription guard to horse creation

## Summary

Added subscription guard to `createHorse` in `lib/services/horseService.ts`.

## Changes

**File:** `lib/services/horseService.ts`

1. **Import** — Added `import { guardHorseCreation } from "@/lib/billing/subscriptionGuard.ts";` after the existing `ApiError` import (line 14).
2. **Guard block** — Inserted after `ensureObjectId` (line 157), before the `doc` object construction. Calls `guardHorseCreation(actorUserId)` and throws a `403 ApiError` if the user has reached their tier's horse limit.

## Verification

- `npx tsc --noEmit` — passes (the 3 pre-existing errors in unrelated test files are unchanged).
- `git commit` — committed as `bd4ca6a` on `main`.
