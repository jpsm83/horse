# Task 3 Report: Async enrichment in `getHorseView`

**Status:** DONE (one minor, documented deviation in test typing)

## What I implemented

In `equus/lib/services/horseService.ts`, inside `getHorseView`, inserted (between `const sections = buildHorseHubSections(horseDoc, audience);` and the `horseView` object literal) the enrichment block verbatim from the brief:

- `sections.value` present → resolve `acquisitionSourceUser` via `resolveUserDetails`, falling back to the main owner when `acquisitionSourceUserId` is unset. Hub-safe projection: `{ userId, name, imageUrl }` — no email, no phone.
- `sections.proactiveRepresentatives` present → resolve `members` from `horseDoc.responsibles` as `{ userId, name, imageUrl }`.
- `sections.coOwnerManagement` present → resolve `members` from `horseDoc.coOwners` as `{ userId, name, imageUrl }`.

The block sits **outside** the `if (audience.isOwnerTeam && userId)` gate, so it runs for anyone who passed L1 (`profileVisibility`) + L2 (`hubSections[key]`) — guests included. `label` from `resolveUserDetails` maps to `name`.

## What I tested and test results

- `npm test -- tests/lib/services/horseService.test.ts` → **PASS, 11 passed** (9 pre-existing + 2 new enrichment tests).
- `npm test -- tests/lib/services/horseHubSections.test.ts` → **PASS, 17 passed** (no regression in `buildHorseHubSections`).

Combined run: `npm test -- tests/lib/services/horseService.test.ts tests/lib/services/horseHubSections.test.ts` → **2 files passed, 28 tests passed**.

```
Test Files  2 passed (2)
     Tests  28 passed (28)
```

## TDD Evidence

**RED** — `npm test -- tests/lib/services/horseService.test.ts` (before implementation):

```
 FAIL  tests/lib/services/horseService.test.ts > getHorseView hub section enrichment > resolves acquisition source and team members for guests when sections are public
AssertionError: expected undefined to match object { …(2) }
- Expected:
{
  "name": Any<String>,
  "userId": "6a6db733655ba655e0f7902c",
}
+ Received:
undefined
 ❯ tests/lib/services/horseService.test.ts:308:62
 Test Files  1 failed (1)
      Tests  1 failed | 10 passed (11)
```

Failed for the correct reason: `acquisitionSourceUser` was `undefined` for guests because enrichment was previously gated by `isOwnerTeam`. (The second new test, "omits value section for guests when value is owner-only", passed at RED — it guards already-correct visibility behavior.)

**GREEN** — `npm test -- tests/lib/services/horseService.test.ts` (after implementation):

```
 Test Files  1 passed (1)
      Tests  11 passed (11)
```

## Files changed

- `equus/lib/services/horseService.ts` — added the Hub-safe enrichment block in `getHorseView`.
- `equus/tests/lib/services/horseService.test.ts` — appended `describe("getHorseView hub section enrichment", ...)` with the 2 tests from the brief.

## Self-review findings

- **Transcription:** Implementation code matches the brief verbatim. Test code matches verbatim except one line (below).
- **Not gated by `isOwnerTeam`:** confirmed — enrichment is placed before the `horseView` literal and outside the `if (audience.isOwnerTeam && userId)` block; guest test asserts `viewerRole === "guest"` and receives enriched sections.
- **No email/phone leak:** only `userId` / `name` / `imageUrl` are projected; the test asserts `acquisitionSourceUser.email` is `undefined`.
- **TypeScript:** my production change introduces **zero** new `tsc --noEmit` errors (verified by stashing and diffing error lists). The repo has many pre-existing errors (e.g. `createHorse` call-signature mismatches at `horseService.test.ts:23/41/…/233`, `horseService.ts:427/429/443`) — confirmed pre-existing via `git stash`.
- **Lint:** `npx eslint` on both files → 0 errors, only a pre-existing unused-var warning (`resolveUserLabel`, `horseService.ts:729`), untouched by this change.

## Deviation from brief (documented)

The brief's verbatim test asserted `view.horse.sections.value?.acquisitionSourceUser?.email` directly. `acquisitionSourceUser` is typed as `HorseHubMemberSummary` (`{ userId; name?; imageUrl? }` — deliberately no email), so that line produced a new TS error (`TS2339: Property 'email' does not exist on type 'HorseHubMemberSummary'`). The brief's own note authorizes adjusting tests when they trip on types. I made a surgical, behavior-identical change:

```ts
expect(
  (view.horse.sections.value?.acquisitionSourceUser as { email?: string } | undefined)?.email,
).toBeUndefined();
```

Runtime assertion semantics unchanged (still verifies no email on the Hub projection); types now resolve.

## Issues / concerns

None beyond the documented deviation above.
