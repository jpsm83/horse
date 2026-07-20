"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppToast } from "@/hooks/use-app-toast";
import { useOwnerHorse, useUpdateHorseSale } from "@/hooks/queries/useHorse.ts";

type HorseValueSectionProps = {
  horseId: string;
};

export function HorseValueSection({ horseId }: HorseValueSectionProps) {
  const t = useTranslations("horseSale");
  const tCommon = useTranslations("common");
  const toast = useAppToast();
  const { data: horse, isPending } = useOwnerHorse(horseId);
  const updateHorseSale = useUpdateHorseSale();

  const [saleStatus, setSaleStatus] = useState("not_for_sale");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [valueCurrency, setValueCurrency] = useState("USD");
  const [askingPrice, setAskingPrice] = useState("");
  const [acquisitionDate, setAcquisitionDate] = useState("");

  useEffect(() => {
    if (!horse) return;
    setSaleStatus(horse.saleStatus as "not_for_sale" | "for_sale" ?? "not_for_sale");
    setEstimatedValue(horse.estimatedValue != null ? String(horse.estimatedValue) : "");
    setValueCurrency(horse.valueCurrency ?? "USD");
    setAskingPrice(horse.askingPrice != null ? String(horse.askingPrice) : "");
    setAcquisitionDate(horse.acquisitionDate ? horse.acquisitionDate.slice(0, 10) : "");
  }, [horse]);

  if (isPending || !horse) {
    return <Skeleton className="h-64 w-full rounded-lg" />;
  }

  const h = horse;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const patch: Record<string, unknown> = {};
    if (saleStatus !== h.saleStatus) patch.saleStatus = saleStatus;
    if (estimatedValue !== String(h.estimatedValue ?? "")) {
      const v = estimatedValue.trim(); patch.estimatedValue = v ? Number(v) : "";
    }
    if (valueCurrency !== (h.valueCurrency ?? "USD")) patch.valueCurrency = valueCurrency.trim() || "";
    if (askingPrice !== String(h.askingPrice ?? "")) {
      const p = askingPrice.trim(); patch.askingPrice = p ? Number(p) : "";
    }
    if (acquisitionDate !== (h.acquisitionDate ? h.acquisitionDate.slice(0, 10) : "")) {
      const d = acquisitionDate.trim(); patch.acquisitionDate = d ? new Date(d) : "";
    }
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
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("saleStatus")}</label>
          <select className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm shadow-xs"
            value={saleStatus} onChange={(e) => setSaleStatus(e.target.value)}>
            <option value="not_for_sale">{t("saleStatusOptions.not_for_sale")}</option>
            <option value="for_sale">{t("saleStatusOptions.for_sale")}</option>
          </select>
        </div>
        {saleStatus === "for_sale" && (
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("askingPrice")}</label>
            <Input type="number" value={askingPrice} onChange={(e) => setAskingPrice(e.target.value)} />
          </div>
        )}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("estimatedValue")}</label>
          <Input type="number" value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("valueCurrency")}</label>
          <select className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm shadow-xs"
            value={valueCurrency} onChange={(e) => setValueCurrency(e.target.value)}>
            <option value="">{t("selectPlaceholder")}</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("acquisitionDate")}</label>
          <Input type="date" value={acquisitionDate} onChange={(e) => setAcquisitionDate(e.target.value)} />
        </div>
      </div>
      <Button type="submit" disabled={updateHorseSale.isPending}>
        {updateHorseSale.isPending ? tCommon("saving") : tCommon("save")}
      </Button>
    </form>
  );
}
