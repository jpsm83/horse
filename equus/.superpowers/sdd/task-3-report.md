# Task 3: Update User model — add subscription embed

## Status: Done

## Changes

**File modified:** `models/User.ts`

1. Added import: `import { tierEnums } from "@/lib/billing/plans.ts";`
2. Added subscription embed field to `userSchema` (before `lastLoginAt`), containing:
   - `tier` — string enum from `tierEnums`, default `"free"`
   - `status` — `"trial" | "active" | "past_due" | "canceled" | "incomplete"`, default `"trial"`
   - `stripeCustomerId` — optional string
   - `stripeSubscriptionId` — optional string
   - `trialEndsAt` — optional Date
   - `currentPeriodStart` — optional Date
   - `currentPeriodEnd` — optional Date
   - `currency` — enum of supported currencies, default `"USD"`
   - `discountPercentage` — number 0–100, default 0
   - `discountValidUntil` — optional Date
   - `canceledAt` — optional Date

**Verified:** `npx tsc --noEmit` shows no new errors.

**Commit:** `10e3aac feat(billing): add subscription embed to User model`
