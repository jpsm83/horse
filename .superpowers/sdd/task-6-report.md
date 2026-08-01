# Task 6 Report — Visibility comment / SoT cleanup in code

## What I implemented

Replaced the two file-header comments verbatim from the brief, updating them from the stale "two-layer" model to the corrected three-control visibility model (Layer 1 open/404 gate, Tabs role-based navigation, Layer 2 Hub content blocks):

1. **`equus/lib/horses/horseVisibilityAccess.ts`** — lines 1-14 header replaced. Old: "Horse two-layer visibility" with Layer 1 / Layer 2 only. New: "Horse visibility" describing three independent controls (L1 profileVisibility → 404, Tabs via `viewerRole`/`allowedTabs`/`deriveAllowedTabs`, L2 hubSections mode), modes, nested inclusion, and audience.
2. **`equus/lib/horses/hubSections.ts`** — lines 1-6 header replaced. Old: "Hub read DTO uses the Hub-facing subset; Admin-only keys still persist here." New: "All keys are Hub-facing" with `buildHorseHubSections` / `attachHubSocialSections`.

`horseService.ts` required no changes (its Hub DTO comments were already updated in Task 2).

## What I tested and results

### Step 3 — grep for stale wording

Searched for `not Hub-facing|Admin-only|Hub-facing` in the three scoped files (`horseService.ts`, `horseVisibilityAccess.ts`, `hubSections.ts`):

- `equus/lib/services/horseService.ts` — no matches.
- `equus/lib/horses/` — one match: the new correct text in `hubSections.ts` line 5 ("All keys are Hub-facing …").

No stale "not Hub-facing" / "Admin-only" wording remains for `value`, `proactiveRepresentatives`, or `coOwnerManagement`. `rg` was not required; used the native grep tool.

### Step 4 — API test suite

`npm test -- tests/lib/services/horseHubSections.test.ts tests/lib/services/horseService.test.ts` from `equus/`:

```
Test Files  2 passed (2)
     Tests  28 passed (28)
```

PASS — no functional change.

## Files changed

- `equus/lib/horses/horseVisibilityAccess.ts` (12 insertions, 4 deletions — comment only)
- `equus/lib/horses/hubSections.ts` (3 insertions, 1 deletion — comment only)

`horseService.ts` staged per brief but unchanged (no diff, not part of commit).

## Self-review findings

- Both file headers transcribed exactly as the brief specified (diff verified against brief text).
- Grep confirms no stale "not Hub-facing"/"Admin-only" wording for the three now-Hub-facing keys.
- API tests pass (28/28).
- No logic, types, or behavior altered — `git show` diff is comment-only.

## Issues or concerns

- None functional. Note: `equus/AGENTS.md` still contains the stale line "Admin-only: `value` | `proactiveRepresentatives` | `coOwnerManagement`." in its Horse visibility policy section. It is outside this task's three-file scope and was left untouched per scope discipline, but flagging it as a potential follow-up cleanup.

## Commit

- `9545d45` docs: align horse visibility comments with three-control model
