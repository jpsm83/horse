# Task 9 Report: Update app/[locale]/layout.tsx with generateMetadata

## Status: ✅ Complete

### What was done

1. **Added imports** in `app/[locale]/layout.tsx`:
   - `import type { Metadata } from "next";`
   - `import { generatePublicMetadata } from "@/lib/seo/metadata-factory.ts";`

2. **Added `generateMetadata` export** before `generateStaticParams`:
   - Async function using `LocaleLayoutProps` that awaits `params`, passes locale to `generatePublicMetadata` with empty route and `"metadata.home"` translation key.

3. **Kept all existing code** — `SetHtmlLang`, `generateStaticParams`, `LocaleLayout`, and all existing imports remain unchanged.

4. **Typecheck** (`npx tsc --noEmit`) — no errors related to the changed file. Three pre-existing errors in test files are unrelated.

5. **Committed** as `feat(seo): add locale-scoped generateMetadata from translations`.
