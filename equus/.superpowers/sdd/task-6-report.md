# Task 6: Update `app/layout.tsx` — Report

## Status: ✅ Complete

### Steps completed

1. **Rewrote `app/layout.tsx`** with:
   - Full `Metadata` export (`metadataBase`, `robots`, `openGraph`, `twitter`, `icons`, `other` with theme-color)
   - `Viewport` export (`width`, `initialScale`, `maximumScale`)
   - `OrganizationJsonLd` and `WebSiteJsonLd` components rendered in the body
   - Base URL read from `process.env.NEXTAUTH_URL` with fallback to `https://equus.app`

2. **Typecheck**: `npx tsc --noEmit` — no errors in `app/layout.tsx` (3 pre-existing test errors unrelated to this task)

3. **Committed**: `ab5fe31` — `feat(seo): add full root metadata, viewport, and JSON-LD`
