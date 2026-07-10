### Task 2: Create `lib/seo/canonical.ts` — Canonical URL and hreflang utilities

**Files:**
- Create: `lib/seo/canonical.ts`

**Produces:** `generateCanonicalUrl(locale, path): string`, `generateLanguageAlternates(route): Record<string, string>`

- [ ] **Step 1: Write the file**

```typescript
import { DOMAIN, supportedLocales } from "./config.ts";

export function generateCanonicalUrl(locale: string, path: string): string {
  const base = DOMAIN.endsWith("/") ? DOMAIN.slice(0, -1) : DOMAIN;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const prefix = locale === "en" ? "" : `/${locale}`;
  return `${base}${prefix}${normalizedPath}`;
}

export function generateLanguageAlternates(
  route: string
): Record<string, string> {
  const alternates: Record<string, string> = {};
  const normalizedRoute = route.startsWith("/") ? route : `/${route}`;

  for (const locale of supportedLocales) {
    const langCode = locale === "en" ? "en-US" : "es-ES";
    const path = locale === "en" ? normalizedRoute : `/${locale}${normalizedRoute}`;
    alternates[langCode] = `${DOMAIN}${path}`;
  }

  return alternates;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/seo/canonical.ts
git commit -m "feat(seo): add canonical URL and hreflang utilities"
```
