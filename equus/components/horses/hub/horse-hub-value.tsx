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
