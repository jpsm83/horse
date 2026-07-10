### Task 7: Create `lib/seo/json-ld.tsx` — JSON-LD structured data components

**Files:**
- Create: `lib/seo/json-ld.tsx`

- [ ] **Step 1: Write JSON-LD components**

Create `lib/seo/json-ld.tsx` with these exports:

- `OrganizationJsonLd` — renders `<script type="application/ld+json">` for schema.org Organization
- `WebSiteJsonLd` — renders WebSite schema
- `HorseJsonLd` — renders Product schema (with optional breed/gender/birthDate)
- `StableJsonLd` — renders LocalBusiness schema (with optional address/telephone)
- `ProfessionalServiceJsonLd` — renders ProfessionalService schema (with optional address/telephone)
- `PersonJsonLd` — renders Person schema
- `BreadcrumbListJsonLd` — renders BreadcrumbList schema from an array of {name, url}

Imports: `SITE_NAME`, `DOMAIN` from `./config.ts`

Each component accepts typed props and returns a `<script>` tag with `dangerouslySetInnerHTML`.

- [ ] **Step 2: Run typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add lib/seo/json-ld.tsx
git commit -m "feat(seo): add JSON-LD structured data components"
```
