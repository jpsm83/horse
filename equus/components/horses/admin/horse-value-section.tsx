"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Controller, useWatch, type Control } from "react-hook-form";

import { TextField } from "@/components/forms/text-field.tsx";
import { HorseSelectField } from "@/components/horses/shared/horse-select-field.tsx";
import { EntityChip } from "@/components/shared/entity-chip.tsx";
import { FieldGroup } from "@/components/ui/field";
import type { SaleFormValues } from "@/lib/validations/horseForms.ts";
import { currencyEnums } from "@/utils/enums.ts";

type HorseValueSectionProps = {
  control: Control<SaleFormValues>;
  /** Read-only acquisition source (falls back to the current owner). */
  acquisitionSourceUser?: {
    userId: string;
    name: string;
    email: string;
    imageUrl?: string;
  };
};

export function HorseValueSection({
  control,
  acquisitionSourceUser,
}: HorseValueSectionProps) {
  const t = useTranslations("horseSale");
  const tCommon = useTranslations("common");

  const saleStatus = useWatch({ control, name: "saleStatus" });

  const saleStatusOptions = useMemo(
    () => [
      { value: "not_for_sale", label: t("saleStatusOptions.not_for_sale") },
      { value: "for_sale", label: t("saleStatusOptions.for_sale") },
    ],
    [t],
  );

  const currencyOptions = useMemo(
    () => currencyEnums.map((v) => ({ value: v, label: v })),
    [],
  );

  return (
    <FieldGroup>
      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          name="saleStatus"
          control={control}
          render={({ field, fieldState }) => (
            <HorseSelectField
              id="admin-saleStatus"
              label={t("saleStatus")}
              placeholder={tCommon("selectPlaceholder")}
              value={field.value}
              onChange={field.onChange}
              invalid={fieldState.invalid}
              error={fieldState.error}
              options={saleStatusOptions}
            />
          )}
        />
        {saleStatus === "for_sale" ? (
          <TextField
            control={control}
            name="askingPrice"
            id="admin-askingPrice"
            label={t("askingPrice")}
            type="number"
          />
        ) : null}
        <TextField
          control={control}
          name="estimatedValue"
          id="admin-estimatedValue"
          label={t("estimatedValue")}
          type="number"
        />
        <Controller
          name="valueCurrency"
          control={control}
          render={({ field, fieldState }) => (
            <HorseSelectField
              id="admin-valueCurrency"
              label={t("valueCurrency")}
              placeholder={tCommon("selectPlaceholder")}
              value={field.value}
              onChange={field.onChange}
              invalid={fieldState.invalid}
              error={fieldState.error}
              options={currencyOptions}
            />
          )}
        />
        <TextField
          control={control}
          name="acquisitionDate"
          id="admin-acquisitionDate"
          label={t("acquisitionDate")}
          type="date"
        />
      </div>

      {acquisitionSourceUser ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-muted-foreground">
            {t("acquisitionSource")}
          </p>
          <EntityChip
            entityType="user"
            entityId={acquisitionSourceUser.userId}
            title={acquisitionSourceUser.name}
            subtitle={acquisitionSourceUser.email || undefined}
            imageUrl={acquisitionSourceUser.imageUrl}
            countryCode={acquisitionSourceUser.countryCode}
          />
        </div>
      ) : null}
    </FieldGroup>
  );
}
