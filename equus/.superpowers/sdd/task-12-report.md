# Task 12: Dynamic entity metadata — report

## Summary

Added server-side `generateMetadata` functions to horse detail and user profile pages, enabling dynamic OG/title metadata.

## Files modified

- `app/[locale]/horses/[horseId]/page.tsx` — added `generateMetadata` using `generateHorseMetadata` from `@/lib/seo/entity-metadata.ts`, fetches horse by ID with `.select("name breed dateOfBirth location description profileImageUrl")`, computes age from `dateOfBirth`, falls back to "Horse Not Found | Equus" on missing/invalid horse.
- `app/[locale]/users/[userId]/page.tsx` — added `generateMetadata` using `generateUserMetadata`, fetches user by ID with `.select("personalDetails")`, constructs `displayName` from `firstName`/`lastName`, falls back to "User Not Found | Equus" on missing/invalid user.

## Changes per file

### Horse page
- Added imports: `type { Metadata } from "next"`, `generateHorseMetadata`, `Horse` model
- Extended `HorseHubPageProps` type to include `locale` in params (already present in URL segment)
- Added `generateMetadata` export with Mongoose query + `generateHorseMetadata` call

### User page
- Added imports: `type { Metadata } from "next"`, `generateUserMetadata`, `User` model
- Extended `UserProfilePageProps` type to include `locale` in params
- Added `generateMetadata` export with Mongoose query + `generateUserMetadata` call

## Verification

- `npx tsc --noEmit` — only pre-existing errors (unrelated test files), no new type issues
- Committed as `9d9671e` with message `feat(seo): add dynamic entity metadata to detail pages`
