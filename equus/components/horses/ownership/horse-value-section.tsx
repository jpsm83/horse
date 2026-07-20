"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { useAppToast } from "@/hooks/use-app-toast";
import { useOwnerHorse, useUpdateHorseSale } from "@/hooks/queries/useHorse.ts";
import { currencyEnums } from "@/utils/enums.ts";

type HorseValueSectionProps = {
  horseId: string;
};

export function HorseValueSection({ horseId }: HorseValueSectionProps) {
  const t = useTranslations("horseSale");
  const tCommon = useTranslations("common");
  const toast = useAppToast();
  const { data: horse } = useOwnerHorse(horseId);
  const h = horse!;
  const updateHorseSale = useUpdateHorseSale();

  const [saleStatus, setSaleStatus] = useState(h.saleStatus ?? "not_for_sale");
  const [estimatedValue, setEstimatedValue] = useState(h.estimatedValue != null ? String(h.estimatedValue) : "");
  const [valueCurrency, setValueCurrency] = useState(h.valueCurrency ?? "USD");
  const [askingPrice, setAskingPrice] = useState(h.askingPrice != null ? String(h.askingPrice) : "");
  const [acquisitionDate, setAcquisitionDate] = useState(h.acquisitionDate ? h.acquisitionDate.slice(0, 10) : "");

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
          <Select value={saleStatus} onValueChange={(val) => setSaleStatus(val ?? "")}>
            <SelectTrigger className="w-full">
              {saleStatus === "not_for_sale" ? t("saleStatusOptions.not_for_sale") : saleStatus === "for_sale" ? t("saleStatusOptions.for_sale") : t("selectPlaceholder")}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="not_for_sale">{t("saleStatusOptions.not_for_sale")}</SelectItem>
              <SelectItem value="for_sale">{t("saleStatusOptions.for_sale")}</SelectItem>
            </SelectContent>
          </Select>
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
          <Select value={valueCurrency} onValueChange={(val) => setValueCurrency(val ?? "")}>
            <SelectTrigger className="w-full">
              {valueCurrency || t("selectPlaceholder")}
            </SelectTrigger>
            <SelectContent>
              {currencyEnums.map((v) => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
