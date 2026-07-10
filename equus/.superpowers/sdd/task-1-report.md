# Task 1 Report: Create `lib/seo/config.ts` — Site Configuration Constants

## What I implemented

Created `lib/seo/config.ts` with the following exports:

- `SITE_NAME` — constant string `"Equus"`
- `DOMAIN` — reads `NEXTAUTH_URL`, falls back to `VERCEL_URL`, then `"https://equus.app"`
- `DEFAULT_OG_IMAGE` — path string `"/og-image.png"`
- `languageMap` — maps locale codes `en`/`es` to full language tags
- `supportedLocales` — array `["en", "es"]`
- `DEFAULT_OG_WIDTH` / `DEFAULT_OG_HEIGHT` — OG image dimensions (1200×630)

## What I tested and results

Ran `npx tsc --noEmit` to type-check the entire project. The new file compiled without errors. Two pre-existing type errors exist in test files (`tests/lib/profile/incompleteProfileBanner.test.ts`, `tests/lib/validations/horseForms.test.ts`) — unrelated to this change.

## Files changed

- `lib/seo/config.ts` — created (new file)

## Self-review findings

- No concerns. The file is small, follows the exact specification, and is consistent with the project's TypeScript conventions.
- No tests apply to this file (pure constants, no logic to test).

## Issues or concerns

None.
