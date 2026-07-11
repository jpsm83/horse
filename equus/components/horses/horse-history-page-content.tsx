"use client";

import { useTranslations } from "next-intl";

import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";

type Props = { horseId: string };

export function HorseHistoryPageContent({ horseId }: Props) {
  const t = useTranslations("horseHistory");

  return (
    <HorsePageShell horseId={horseId} title={t("title")}>
      <p className="text-muted-foreground">{t("comingSoon")}</p>
    </HorsePageShell>
  );
}
