### Task 8: Create `lib/seo/entity-metadata.ts` — Entity-specific metadata builders

**Files:**
- Create: `lib/seo/entity-metadata.ts`

- [ ] **Step 1: Write entity metadata builders**

Create `lib/seo/entity-metadata.ts` with these exports:

- `generateHorseMetadata(horse, locale, horseId)` — Title = horse name, desc = breed/age/location
- `generateStableMetadata(stable, locale, stableId)` — Title = stable name, desc = location
- `generateProviderMetadata(provider, type, locale, providerId)` — Title = businessName or name
- `generateUserMetadata(user, locale, userId)` — Title = displayName

All use a shared `buildEntityMetadata` helper that constructs Metadata with:
- title: `"{entityName} | Equus"`
- description from entity data
- OG type "website"
- Twitter summary_large_image
- Canonical URL via `generateCanonicalUrl(locale, canonicalPath)`

Imports: `generateCanonicalUrl` from `./canonical.ts`, `DOMAIN`, `SITE_NAME` from `./config.ts`

- [ ] **Step 2: Run typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add lib/seo/entity-metadata.ts
git commit -m "feat(seo): add entity-specific metadata builders"
```
