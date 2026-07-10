# Task 10 Report — Add metadata to 16 static public pages

## Summary

Added `generateMetadata` exports to all 16 static public listing pages under `app/[locale]/`, providing unique `<title>`, `<meta description>`, OG tags, Twitter cards, canonical URLs, and language alternates for each route.

## Files modified

| File | Route | Title key |
|------|-------|-----------|
| `app/[locale]/page.tsx` | `""` | `metadata.home` |
| `app/[locale]/home/page.tsx` | `"/home"` | `metadata.homeDashboard` |
| `app/[locale]/horses/page.tsx` | `"/horses"` | `metadata.horses` |
| `app/[locale]/stables/page.tsx` | `"/stables"` | `metadata.stables` |
| `app/[locale]/breeders/page.tsx` | `"/breeders"` | `metadata.breeders` |
| `app/[locale]/transport/page.tsx` | `"/transport"` | `metadata.transport` |
| `app/[locale]/trainers/page.tsx` | `"/trainers"` | `metadata.trainers` |
| `app/[locale]/groomers/page.tsx` | `"/groomers"` | `metadata.groomers` |
| `app/[locale]/riders/page.tsx` | `"/riders"` | `metadata.riders` |
| `app/[locale]/coaches/page.tsx` | `"/coaches"` | `metadata.coaches` |
| `app/[locale]/farriers/page.tsx` | `"/farriers"` | `metadata.farriers` |
| `app/[locale]/veterinaries/page.tsx` | `"/veterinaries"` | `metadata.veterinaries` |
| `app/[locale]/riding-clubs/page.tsx` | `"/riding-clubs"` | `metadata.ridingClubs` |
| `app/[locale]/workplaces/page.tsx` | `"/workplaces"` | `metadata.workplaces` |
| `app/[locale]/relationships/page.tsx` | `"/relationships"` | `metadata.relationships` |
| `app/[locale]/ownership-transfers/page.tsx` | `"/ownership-transfers"` | `metadata.ownershipTransfers` |

## Pattern used

Each file now imports `generatePublicMetadata` from `@/lib/seo/metadata-factory.ts` and exports an async `generateMetadata` function that resolves the locale from `params` and delegates to the factory with the correct route and title key.

## Verification

- `npx tsc --noEmit` — all errors are pre-existing in test files; no type errors in the modified pages.
- All 16 files committed together in a single commit: `d6cda1a`

## Commit

```
d6cda1a feat(seo): add metadata to all static public pages
```
