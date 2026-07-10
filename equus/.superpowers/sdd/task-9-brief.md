### Task 9: Update `app/[locale]/layout.tsx` — add generateMetadata

**Files:**
- Modify: `app/[locale]/layout.tsx`

- [ ] **Step 1: Add `generateMetadata` export to locale layout**

Read the current `app/[locale]/layout.tsx`. Add an import for `type { Metadata } from "next"` and `import { generatePublicMetadata } from "@/lib/seo/metadata-factory.ts"`. Then add the `generateMetadata` async function before the `generateStaticParams` or default export.

```typescript
import type { Metadata } from "next";
import { generatePublicMetadata } from "@/lib/seo/metadata-factory.ts";

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

// Add this new export:
export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePublicMetadata(locale, "", "metadata.home");
}
```

Keep the existing `SetHtmlLang` component and all other existing code. Only add the import + the `generateMetadata` export.

- [ ] **Step 2: Run typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add "app/[locale]/layout.tsx"
git commit -m "feat(seo): add locale-scoped generateMetadata from translations"
```
