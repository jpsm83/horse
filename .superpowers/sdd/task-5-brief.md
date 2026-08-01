# Task 5: Rename Description → Value (files + Hub UI)

**Files:**
- Delete: `equus/components/horses/hub/horse-hub-description.tsx`
- Create: `equus/components/horses/hub/horse-hub-value.tsx`
- Modify: `equus/app/[locale]/horses/[horseId]/client.tsx`
- Modify: `equus/messages/en.json`
- Modify: `equus/messages/es.json`

**Interfaces:**
- Consumes: `horse.sections.value` (`HorseHubValueSection`), `horseSale` + `horseHub` i18n namespaces, `EntityChip`, `Section`.
- Produces: `HorseHubValue({ horse, className })` — returns `null` when `sections.value` absent; read-only display of Admin Horse Value fields.

- [ ] **Step 1: Create `horse-hub-value.tsx`**

Create `equus/components/horses/hub/horse-hub-value.tsx`:

```tsx
/**
 * HorseHubValue — Hub tab Value card. Read-only view of the Admin Horse Value
 * fields (sale status, asking price, estimated value, acquisition date,
 * acquisition source) when the Layer-2 `value` section allows it.
 *
 * Assembled by HubContent. Reads `horse.sections.value` from useHorseView.
 * No visibility popovers on Hub.
 */

"use client";

import { useLocale, useTranslations } from "next-intl";

import { EntityChip } from "@/components/shared/entity-chip.tsx";
import { Section } from "@/components/shared/section.tsx";
import type { AppLocale } from "@/i18n/resolveLocale.ts";
import type { HorseViewDto } from "@/lib/services/horseService.ts";
import { cn } from "@/lib/utils";

type HorseHubValueProps = {
  horse: HorseViewDto;
  className?: string;
};

export function HorseHubValue({ horse, className }: HorseHubValueProps) {
  const t = useTranslations("horseHub");
  const tSale = useTranslations("horseSale");
  const locale = useLocale() as AppLocale;
  const value = horse.sections.value;
  if (!value) return null;

  const saleStatusLabel = value.saleStatus
    ? tSale(`saleStatusOptions.${value.saleStatus}` as "saleStatusOptions.for_sale")
    : undefined;

  const acquisitionDateLabel = value.acquisitionDate
    ? new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(new Date(value.acquisitionDate))
    : undefined;

  const estimatedValueLabel =
    value.estimatedValue != null
      ? value.valueCurrency
        ? `${value.estimatedValue} ${value.valueCurrency}`
        : String(value.estimatedValue)
      : undefined;

  return (
    <Section title={t("value")} className={cn(className)}>
      <dl className="flex flex-col gap-3">
        {saleStatusLabel ? (
          <div className="flex flex-col gap-1">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              {tSale("saleStatus")}
            </dt>
            <dd className="text-sm text-foreground">{saleStatusLabel}</dd>
          </div>
        ) : null}
        {value.saleStatus === "for_sale" && value.askingPrice != null ? (
          <div className="flex flex-col gap-1">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              {tSale("askingPrice")}
            </dt>
            <dd className="text-sm text-foreground">{value.askingPrice}</dd>
          </div>
        ) : null}
        {estimatedValueLabel ? (
          <div className="flex flex-col gap-1">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              {tSale("estimatedValue")}
            </dt>
            <dd className="text-sm text-foreground">{estimatedValueLabel}</dd>
          </div>
        ) : null}
        {acquisitionDateLabel ? (
          <div className="flex flex-col gap-1">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              {tSale("acquisitionDate")}
            </dt>
            <dd className="text-sm text-foreground">{acquisitionDateLabel}</dd>
          </div>
        ) : null}
        {value.acquisitionSourceUser ? (
          <div className="flex flex-col gap-1">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              {tSale("acquisitionSource")}
            </dt>
            <dd>
              <EntityChip
                entityType="user"
                entityId={value.acquisitionSourceUser.userId}
                title={value.acquisitionSourceUser.name ?? ""}
                subtitle={undefined}
                imageUrl={value.acquisitionSourceUser.imageUrl}
              />
            </dd>
          </div>
        ) : null}
      </dl>
    </Section>
  );
}
```

Note: the `tSale("saleStatusOptions.${...}")` cast to `"saleStatusOptions.for_sale"` works because the type is a union of the two valid status keys; cast to `"saleStatusOptions.for_sale"` (or `"saleStatusOptions.not_for_sale"`) is safe here.

- [ ] **Step 2: Delete `horse-hub-description.tsx`**

Delete `equus/components/horses/hub/horse-hub-description.tsx`.

- [ ] **Step 3: Update `client.tsx` imports and layout order**

In `equus/app/[locale]/horses/[horseId]/client.tsx`:

Change the import:
```tsx
import { HorseHubDescription } from "@/components/horses/hub/horse-hub-description.tsx";
```
to:
```tsx
import { HorseHubValue } from "@/components/horses/hub/horse-hub-value.tsx";
```

Change the left-column usage (currently `<HorseHubDescription />`):
```tsx
<HorseHubValue horse={horse} />
```

The left column order becomes: About → Disciplines → Value.

- [ ] **Step 4: Update i18n keys — rename `description` → `value` + add `valueEmpty`**

In `equus/messages/en.json`, inside `horseHub`:
- Rename `"description": "Description"` → `"value": "Value"`
- Add `"valueEmpty": "No value information yet."` (place it right after `"value"`)

In `equus/messages/es.json`, inside `horseHub`:
- Rename `"description": "Descripción"` → `"value": "Valor"`
- Add `"valueEmpty": "Aún no hay información de valor."` (place it right after `"value"`)

Keep `"aboutEmpty"` unchanged (used by About).

- [ ] **Step 5: Grep for stale `HorseHubDescription` / `horse-hub-description` references**

Run: `rg -n "HorseHubDescription|horse-hub-description" equus/app equus/components equus/documentation`
Expected: only doc references remain (Task 7 fixes those). No code references.

- [ ] **Step 6: Run lint**

Run: `npm run lint -- "app/[locale]/horses/[horseId]/client.tsx" "components/horses/hub/horse-hub-value.tsx"`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add "equus/app/[locale]/horses/[horseId]/client.tsx" equus/components/horses/hub/ equus/messages/en.json equus/messages/es.json
git commit -m "feat: rename hub description section to value with read-only display"
```
