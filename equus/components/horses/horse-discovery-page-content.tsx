"use client";

import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";

import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { HorseDiscoveryForm } from "@/components/horses/horse-discovery-form.tsx";
import { queryKeys } from "@/lib/api/queryKeys";

type Props = { horseId: string };

export function HorseDiscoveryPageContent({ horseId }: Props) {
  const t = useTranslations("horseDiscovery");
  const queryClient = useQueryClient();

  return (
    <HorsePageShell horseId={horseId} title={t("title")} requireOwnership>
      {({ horse }) => (
        <HorseDiscoveryForm
          horseId={horseId}
          horse={horse}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: queryKeys.horses.owner(horseId) });
          }}
        />
      )}
    </HorsePageShell>
  );
}
