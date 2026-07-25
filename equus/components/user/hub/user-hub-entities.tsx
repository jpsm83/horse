/**
 * UserHubEntities — preview of the user's horses and entity profiles.
 * Shows navigation summary from the server-seeded cache.
 */

"use client";

import { useTranslations } from "next-intl";
import { useUserNavigation } from "@/hooks/queries/useCurrentUser.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";

type Props = {
  userId: string;
};

export function UserHubEntities({ userId }: Props) {
  const t = useTranslations("userHub");
  const { data: navigation, isPending } = useUserNavigation(true);

  if (isPending) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-5 w-40" />
      </div>
    );
  }

  const hasHorses = navigation?.horses === true;

  if (!hasHorses) {
    return <p className="text-sm text-muted-foreground">{t("noEntities")}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">
        {t("hasHorses")}
      </p>
    </div>
  );
}
