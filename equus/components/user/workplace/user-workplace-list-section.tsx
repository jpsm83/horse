/**
 * UserWorkplaceListSection — active owned and collaboration workplaces.
 */

"use client";

import { useTranslations } from "next-intl";
import { Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useWorkplaces } from "@/hooks/queries";

export function UserWorkplaceListSection() {
  const t = useTranslations("userWorkplace");
  const { data: workplaces, isPending } = useWorkplaces();

  const active = (workplaces ?? []).filter(
    (w) => w.status === "active" || w.access === "owner",
  );

  if (isPending) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-4 rounded-lg border p-4">
            <Skeleton className="h-8 w-8 rounded-md" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (active.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noWorkplaces")}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {active.map((workplace) => (
        <div
          key={workplace.workplaceRelationshipId ?? workplace.roleProfileId}
          className="flex items-center gap-4 rounded-lg border p-4"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
            <Building2 className="h-5 w-5 text-muted-foreground" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium">{workplace.profileName ?? t("unknownWorkplace")}</p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              <Badge variant="secondary" className="text-xs">{workplace.roleType}</Badge>
              {workplace.access === "owner" ? (
                <Badge variant="outline" className="text-xs">{t("ownerBadge")}</Badge>
              ) : null}
              {workplace.hierarchyLevel ? (
                <span className="text-xs text-muted-foreground capitalize">
                  {workplace.hierarchyLevel}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
