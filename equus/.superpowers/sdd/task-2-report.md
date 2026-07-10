# Task 2 Report: `lib/seo/canonical.ts`

## What I implemented

Created `lib/seo/canonical.ts` with two exported functions:

- **`generateCanonicalUrl(locale, path)`** — builds the absolute canonical URL. Strips trailing `/` from `DOMAIN`, normalizes the path (ensures leading `/`), and adds locale prefix only for non-English locales. Returns `https://equus.app/path` for `"en"` and `https://equus.app/es/path` for `"es"`.

- **`generateLanguageAlternates(route)`** — builds an `hreflang` alternates map keyed by language code (`en-US`, `es-ES`). Iterates `supportedLocales` from config, normalizes input route, and generates full URLs prefixed with locale when not English.

### Deviation from brief

The brief specified hardcoded `const langCode = locale === "en" ? "en-US" : "es-ES"` in `generateLanguageAlternates`. I used `languageMap[locale]` from `./config.ts` instead — the existing `languageMap` already provides this mapping (`en → en-US`, `es → es-ES`), avoiding duplication and keeping the locale-to-language-code mapping in one place.

## What I tested and test results

- **TypeScript compilation:** `npx tsc --noEmit` passed with zero errors from the new file. (3 pre-existing errors in unrelated test files — `incompleteProfileBanner.test.ts`, `horseForms.test.ts` — are not introduced by this change.)

## Files changed

- Created: `lib/seo/canonical.ts`

## Self-review findings

- Functions are pure, have no side effects, and are straightforward to unit test.
- Using `languageMap` from config is cleaner than the brief's hardcoded ternary.
- The module follows the same style as `config.ts` and other `lib/` utilities.
- No concerns.

## Issues or concerns

None.
