"use client";

import { Skeleton } from "@/components/ui/skeleton.tsx";
import { HorseSaleForm } from "@/components/horses/horse-sale-form.tsx";
import { useOwnerHorse } from "@/hooks/queries/useHorse.ts";

type SaleSettingsSectionProps = {
  horseId: string;
};

export function SaleSettingsSection({ horseId }: SaleSettingsSectionProps) {
  const { data: horse, isPending } = useOwnerHorse(horseId);

  if (isPending || !horse) {
    return <Skeleton className="h-64 w-full rounded-lg" />;
  }

  return <HorseSaleForm horseId={horseId} horse={horse} />;
}
