"use client";

import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FieldSet, FieldGroup, FieldLegend } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { SelectField } from "@/components/forms/select-field";
import { TextField } from "@/components/forms/text-field";
import { useAppToast } from "@/hooks/use-app-toast";
import { useOwnerHorse, useUpdateHorseSale } from "@/hooks/queries/useHorse.ts";
import { horseFormMessagesFromTranslations, saleFormSchemas, type SaleFormValues } from "@/lib/validations/horseForms.ts";
import { currencyEnums } from "@/utils/enums.ts";

type HorseValueSectionProps = {
  horseId: string;
};

export function HorseValueSection({ horseId }: HorseValueSectionProps) {
  const t = useTranslations("horseSale");
  const tCommon = useTranslations("common");
  const toast = useAppToast();
  const { data: horse, isPending } = useOwnerHorse(horseId);
  const updateHorseSale = useUpdateHorseSale();

  const formMessages = useMemo(() => horseFormMessagesFromTranslations(t), [t]);
  const { saleFormSchema } = useMemo(() => saleFormSchemas(formMessages), [formMessages]);

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      saleStatus: (horse?.saleStatus as "not_for_sale" | "for_sale") ?? "not_for_sale",
      estimatedValue: horse?.estimatedValue != null ? String(horse.estimatedValue) : "",
      valueCurrency: horse?.valueCurrency ?? "USD",
      askingPrice: horse?.askingPrice != null ? String(horse.askingPrice) : "",
      acquisitionDate: horse?.acquisitionDate ? horse.acquisitionDate.slice(0, 10) : "",
      acquisitionSource: horse?.acquisitionSource ?? "",
    },
  });

  const saleStatus = form.watch("saleStatus");

  if (isPending || !horse) {
    return <Skeleton className="h-64 w-full rounded-lg" />;
  }

  async function onSubmit(values: SaleFormValues) {
    const dirty = form.formState.dirtyFields as Record<string, boolean>;
    const patch: Record<string, unknown> = {};
    if (dirty.saleStatus) patch.saleStatus = values.saleStatus;
    if (dirty.estimatedValue) { const v = values.estimatedValue.trim(); patch.estimatedValue = v ? Number(v) : ""; }
    if (dirty.valueCurrency) patch.valueCurrency = values.valueCurrency.trim() || "";
    if (dirty.askingPrice) { const p = values.askingPrice.trim(); patch.askingPrice = p ? Number(p) : ""; }
    if (dirty.acquisitionDate) { const d = values.acquisitionDate.trim(); patch.acquisitionDate = d ? new Date(d) : ""; }
    if (dirty.acquisitionSource) patch.acquisitionSource = values.acquisitionSource.trim() || "";

    if (Object.keys(patch).length === 0) {
      toast.info(t("noChanges"));
      return;
    }
    try {
      await updateHorseSale.mutateAsync({ horseId, patch });
      toast.success(t("saved"));
    } catch {
      toast.error(t("saveFailed"));
    }
  }

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldSet>
        <FieldLegend className="pb-3 font-semibold">{t("title")}</FieldLegend>
        <FieldGroup>
          <div className="grid gap-5 sm:grid-cols-2">
            <Controller name="saleStatus" control={form.control} render={({ field, fieldState }) => (
              <SelectField id="value-saleStatus" label={t("saleStatus")} value={field.value} onChange={field.onChange}
                invalid={fieldState.invalid} error={fieldState.error}
                options={[{ value: "not_for_sale", label: t("saleStatusOptions.not_for_sale") }, { value: "for_sale", label: t("saleStatusOptions.for_sale") }]} />
            )} />
            {saleStatus === "for_sale" && (
              <TextField control={form.control} name="askingPrice" id="value-askingPrice" label={t("askingPrice")} type="number" />
            )}
            <TextField control={form.control} name="estimatedValue" id="value-estimatedValue" label={t("estimatedValue")} type="number" />
            <Controller name="valueCurrency" control={form.control} render={({ field, fieldState }) => (
              <SelectField id="value-valueCurrency" label={t("valueCurrency")} placeholder={t("selectPlaceholder")}
                value={field.value} onChange={field.onChange} invalid={fieldState.invalid} error={fieldState.error}
                options={[{ value: "", label: t("selectPlaceholder") }, ...currencyEnums.map(v => ({ value: v, label: v }))]} />
            )} />
            <TextField control={form.control} name="acquisitionDate" id="value-acquisitionDate" label={t("acquisitionDate")} type="date" />
            <TextField control={form.control} name="acquisitionSource" id="value-acquisitionSource" label={t("acquisitionSource")} />
          </div>
        </FieldGroup>
      </FieldSet>
      <Button type="submit" disabled={updateHorseSale.isPending}>
        {updateHorseSale.isPending ? tCommon("saving") : tCommon("save")}
      </Button>
    </form>
  );
}
