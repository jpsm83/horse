"use client";

import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";

import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { HorseEditForm } from "@/components/horses/horse-edit-form.tsx";
import { queryKeys } from "@/lib/api/queryKeys";

type HorseEditPageContentProps = {
  horseId: string;
};

export function HorseEditPageContent({ horseId }: HorseEditPageContentProps) {
  const t = useTranslations("horseEdit");
  const queryClient = useQueryClient();

  return (
    <HorsePageShell horseId={horseId} title={t("title")} requireOwnership>
      {({ horse }) => (
        <HorseEditForm
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
