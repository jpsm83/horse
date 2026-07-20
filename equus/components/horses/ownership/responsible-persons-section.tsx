"use client";

import { useTranslations } from "next-intl";

import { Skeleton } from "@/components/ui/skeleton.tsx";
import { ResponsibleList } from "@/components/horses/ownership/responsible-list.tsx";
import { InviteResponsibleForm } from "@/components/horses/ownership/invite-responsible-form.tsx";
import { useOwnerHorse } from "@/hooks/queries/useHorse.ts";
import { useCreateOwnershipTransfer } from "@/hooks/queries/useOwnershipTransfer.ts";

type ResponsiblePersonsSectionProps = {
  horseId: string;
};

export function ResponsiblePersonsSection({ horseId }: ResponsiblePersonsSectionProps) {
  const t = useTranslations("horseAdmin");
  const { data: horse, isPending } = useOwnerHorse(horseId);
  const createTransfer = useCreateOwnershipTransfer();

  if (isPending || !horse) {
    return <Skeleton className="h-32 w-full rounded-lg" />;
  }

  if (!horse.isMainOwner) {
    return null;
  }

  return (
    <div className="space-y-4">
      <ResponsibleList
        responsibles={horse.responsibles}
        isMainOwner={horse.isMainOwner}
        emptyLabel={t("noResponsibles")}
        removeLabel={t("removeResponsible")}
        onRemove={(userId) =>
          createTransfer.mutate({
            entityType: "horse",
            entityId: horseId,
            transferKind: "remove_responsible",
            targetCoOwnerUserId: userId,
          })
        }
      />
      <InviteResponsibleForm
        horseId={horseId}
        isPending={createTransfer.isPending}
        inviteLabel={t("inviteResponsible")}
        emailPlaceholder={t("inviteEmailPlaceholder")}
        onSubmit={(email) =>
          createTransfer.mutate({
            entityType: "horse",
            entityId: horseId,
            transferKind: "add_responsible",
            invitedEmail: email,
          })
        }
      />
    </div>
  );
}
