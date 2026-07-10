### Task 1: Create `lib/seo/config.ts` — Site configuration constants

**Files:**
- Create: `lib/seo/config.ts`

**Produces:** `SITE_NAME`, `DOMAIN`, `DEFAULT_OG_IMAGE`, `languageMap`, `supportedLocales`, OG dimensions

- [ ] **Step 1: Write the file**

```typescript
export const SITE_NAME = "Equus";
export const DOMAIN =
  process.env.NEXTAUTH_URL || process.env.VERCEL_URL || "https://equus.app";

export const DEFAULT_OG_IMAGE = "/og-image.png";

export const languageMap: Record<string, string> = {
  en: "en-US",
  es: "es-ES",
};

export const supportedLocales = ["en", "es"];

export const DEFAULT_OG_WIDTH = 1200;
export const DEFAULT_OG_HEIGHT = 630;
```

- [ ] **Step 2: Commit**

```bash
git add lib/seo/config.ts
git commit -m "feat(seo): add site configuration constants"
```
