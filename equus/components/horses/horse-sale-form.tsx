"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";

import { SelectField } from "@/components/forms/select-field.tsx";
import { TextField } from "@/components/forms/text-field.tsx";
import { Button } from "@/components/ui/button";
import {
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { useUpdateHorseSale } from "@/hooks/queries/useHorse.ts";
import type { OwnerHorseSummary } from "@/lib/api/horseClient";
import {
  horseFormMessagesFromTranslations,
  saleFormSchemas,
  type SaleFormValues,
} from "@/lib/validations/horseForms.ts";
import { currencyEnums } from "@/utils/enums.ts";
import { useRouter } from "@/i18n/navigation";

type HorseSaleFormProps = {
  horseId: string;
  horse: OwnerHorseSummary;
};

export function HorseSaleForm({ horseId, horse }: HorseSaleFormProps) {
  const router = useRouter();
  const t = useTranslations("horseSale");
  const tCommon = useTranslations("common");
  const toast = useAppToast();
  const updateHorseSale = useUpdateHorseSale();

  const formMessages = useMemo(
    () => horseFormMessagesFromTranslations(t),
    [t],
  );

  const { saleFormSchema } = useMemo(
    () => saleFormSchemas(formMessages),
    [formMessages],
  );

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      saleStatus: (horse.saleStatus as "not_for_sale" | "for_sale") ?? "not_for_sale",
      estimatedValue: horse.estimatedValue != null ? String(horse.estimatedValue) : "",
      valueCurrency: horse.valueCurrency ?? "USD",
      askingPrice: horse.askingPrice != null ? String(horse.askingPrice) : "",
      showValuePublicly: horse.showValuePublicly ? "true" : "false",
      acquisitionDate: horse.acquisitionDate ? horse.acquisitionDate.slice(0, 10) : "",
      acquisitionSource: horse.acquisitionSource ?? "",
    },
  });

  const { dirtyFields } = form.formState;
  const isPending = updateHorseSale.isPending;
  const saleStatus = form.watch("saleStatus");

  const saleStatusOptions = useMemo(
    () => [
      { value: "not_for_sale", label: t("saleStatusOptions.not_for_sale") },
      { value: "for_sale", label: t("saleStatusOptions.for_sale") },
    ],
    [t],
  );

  const currencyOptions = useMemo(
    () => [
      { value: "", label: t("selectPlaceholder") },
      ...currencyEnums.map((v) => ({ value: v, label: v })),
    ],
    [t],
  );

  const yesNoOptions = useMemo(
    () => [
      { value: "true", label: t("yes") },
      { value: "false", label: t("no") },
    ],
    [t],
  );

  function buildPatch(values: SaleFormValues): Record<string, unknown> {
    const patch: Record<string, unknown> = {};
    const dirty = dirtyFields as Record<string, boolean>;

    if (dirty.saleStatus) patch.saleStatus = values.saleStatus;
    if (dirty.estimatedValue) {
      const v = values.estimatedValue.trim();
      patch.estimatedValue = v ? Number(v) : "";
    }
    if (dirty.valueCurrency) patch.valueCurrency = values.valueCurrency.trim() || "";
    if (dirty.askingPrice) {
      const p = values.askingPrice.trim();
      patch.askingPrice = p ? Number(p) : "";
    }
    if (dirty.showValuePublicly) patch.showValuePublicly = values.showValuePublicly === "true";
    if (dirty.acquisitionDate) {
      const d = values.acquisitionDate.trim();
      patch.acquisitionDate = d ? new Date(d) : "";
    }
    if (dirty.acquisitionSource) patch.acquisitionSource = values.acquisitionSource.trim() || "";

    return patch;
  }

  async function onSubmit(values: SaleFormValues) {
    const patch = buildPatch(values);

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
            <Controller
              name="saleStatus"
              control={form.control}
              render={({ field, fieldState }) => (
                <SelectField
                  id="sale-saleStatus"
                  label={t("saleStatus")}
                  value={field.value}
                  onChange={field.onChange}
                  invalid={fieldState.invalid}
                  error={fieldState.error}
                  options={saleStatusOptions}
                />
              )}
            />

            {saleStatus === "for_sale" && (
              <TextField
                control={form.control}
                name="askingPrice"
                id="sale-askingPrice"
                label={t("askingPrice")}
                type="number"
              />
            )}

            <TextField
              control={form.control}
              name="estimatedValue"
              id="sale-estimatedValue"
              label={t("estimatedValue")}
              type="number"
            />

            <Controller
              name="valueCurrency"
              control={form.control}
              render={({ field, fieldState }) => (
                <SelectField
                  id="sale-valueCurrency"
                  label={t("valueCurrency")}
                  placeholder={t("selectPlaceholder")}
                  value={field.value}
                  onChange={field.onChange}
                  invalid={fieldState.invalid}
                  error={fieldState.error}
                  options={currencyOptions}
                />
              )}
            />

            <Controller
              name="showValuePublicly"
              control={form.control}
              render={({ field, fieldState }) => (
                <SelectField
                  id="sale-showValuePublicly"
                  label={t("showValuePublicly")}
                  value={field.value}
                  onChange={field.onChange}
                  invalid={fieldState.invalid}
                  error={fieldState.error}
                  options={yesNoOptions}
                />
              )}
            />

            <TextField
              control={form.control}
              name="acquisitionDate"
              id="sale-acquisitionDate"
              label={t("acquisitionDate")}
              type="date"
            />

            <TextField
              control={form.control}
              name="acquisitionSource"
              id="sale-acquisitionSource"
              label={t("acquisitionSource")}
            />
          </div>
        </FieldGroup>
      </FieldSet>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? tCommon("saving") : tCommon("save")}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push(`/horses/${horseId}`)}>
          {tCommon("cancel")}
        </Button>
      </div>
    </form>
  );
}
