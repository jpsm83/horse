/**
 * HorseHubValue — Hub tab Value card. Read-only view of the Admin Horse Value
 * fields (sale status, asking price, estimated value, acquisition date,
 * acquisition source) when the Layer-2 `value` section allows it.
 *
 * Assembled by HubContent. Reads `horse.sections.value` from useHorseView.
 * No visibility popovers on Hub.
 */

"use client";

import { Calendar, CircleDollarSign } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { EntityChip } from "@/components/shared/entity-chip.tsx";
import { Section } from "@/components/shared/section.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import type { AppLocale } from "@/i18n/resolveLocale.ts";
import type { HorseViewDto } from "@/lib/services/horseService.ts";
import { cn } from "@/lib/utils";

type HorseHubValueProps = {
  horse: HorseViewDto;
  className?: string;
};

/**
 * Format an amount using ISO 4217 currency rules via Intl
 * (locale grouping + currency-specific fraction digits, e.g. USD/EUR → 2).
 * Falls back to USD when currency is missing (Horse model default).
 */
function formatMoney(
  amount: number,
  currency: string | undefined,
  locale: AppLocale,
): string {
  const code =
    currency && /^[A-Z]{3}$/i.test(currency.trim())
      ? currency.trim().toUpperCase()
      : "USD";

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      currencyDisplay: "symbol",
    }).format(amount);
  } catch {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "USD",
      currencyDisplay: "symbol",
    }).format(amount);
  }
}

export function HorseHubValue({ horse, className }: HorseHubValueProps) {
  const t = useTranslations("horseHub");
  const tSale = useTranslations("horseSale");
  const locale = useLocale() as AppLocale;
  const value = horse.sections.value;
  if (!value) return null;

  const saleStatusLabel = value.saleStatus
    ? tSale(`saleStatusOptions.${value.saleStatus}` as "saleStatusOptions.for_sale")
    : undefined;
  const isForSale = value.saleStatus === "for_sale";

  const askingPriceLabel =
    isForSale && value.askingPrice != null
      ? formatMoney(value.askingPrice, value.valueCurrency, locale)
      : undefined;

  const estimatedValueLabel =
    value.estimatedValue != null
      ? formatMoney(value.estimatedValue, value.valueCurrency, locale)
      : undefined;

  const acquisitionDateLabel = value.acquisitionDate
    ? new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(new Date(value.acquisitionDate))
    : undefined;

  const hasContent = Boolean(
    saleStatusLabel ||
      askingPriceLabel ||
      estimatedValueLabel ||
      acquisitionDateLabel ||
      value.acquisitionSourceUser,
  );

  return (
    <Section
      title={t("value")}
      className={cn(className)}
      titleAddon={
        saleStatusLabel ? (
          <Badge variant={isForSale ? "default" : "secondary"}>
            {saleStatusLabel}
          </Badge>
        ) : undefined
      }
    >
      {hasContent ? (
        <div className="flex flex-col gap-4">
          {askingPriceLabel || estimatedValueLabel ? (
            <div className="flex flex-col gap-3">
              {askingPriceLabel ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
                    <CircleDollarSign className="size-4 shrink-0" aria-hidden />
                    <p className="text-xs uppercase tracking-wide">
                      {tSale("askingPrice")}
                    </p>
                  </div>
                  <p className="shrink-0 text-2xl font-semibold tracking-tight text-foreground">
                    {askingPriceLabel}
                  </p>
                </div>
              ) : null}
              {estimatedValueLabel ? (
                <div
                  className={cn(
                    "flex items-center justify-between gap-3",
                    askingPriceLabel && "border-t border-border pt-3",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
                    <CircleDollarSign className="size-4 shrink-0" aria-hidden />
                    <p className="text-xs uppercase tracking-wide">
                      {tSale("estimatedValue")}
                    </p>
                  </div>
                  <p
                    className={cn(
                      "shrink-0 text-foreground",
                      askingPriceLabel
                        ? "text-base font-medium"
                        : "text-2xl font-semibold tracking-tight",
                    )}
                  >
                    {estimatedValueLabel}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {acquisitionDateLabel || value.acquisitionSourceUser ? (
            <div
              className={cn(
                "flex flex-col gap-4",
                (askingPriceLabel || estimatedValueLabel) &&
                  "border-t border-border pt-4",
              )}
            >
              {acquisitionDateLabel ? (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="size-4 shrink-0" aria-hidden />
                    <p className="text-xs uppercase tracking-wide">
                      {tSale("acquisitionDate")}
                    </p>
                  </div>
                  <p className="text-sm text-foreground pl-6">
                    {acquisitionDateLabel}
                  </p>
                </div>
              ) : null}
              {value.acquisitionSourceUser ? (
                <div
                  className={cn(
                    "flex flex-col gap-2",
                    acquisitionDateLabel && "border-t border-border pt-3",
                  )}
                >
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {tSale("acquisitionSource")}
                  </p>
                  <EntityChip
                    entityType="user"
                    entityId={value.acquisitionSourceUser.userId}
                    title={value.acquisitionSourceUser.name ?? ""}
                    subtitle={undefined}
                    imageUrl={value.acquisitionSourceUser.imageUrl}
                    countryCode={value.acquisitionSourceUser.countryCode}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t("valueEmpty")}</p>
      )}
    </Section>
  );
}
