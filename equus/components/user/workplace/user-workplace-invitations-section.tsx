/**
 * UserWorkplaceInvitationsSection — pending workplace invitation cards with Accept/Decline.
 */

"use client";

import { useTranslations } from "next-intl";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  useWorkplaces,
  useAcceptWorkplaceInvitation,
  useDeclineWorkplaceInvitation,
} from "@/hooks/queries";
import { useAppToast } from "@/hooks/use-app-toast.ts";

export function UserWorkplaceInvitationsSection() {
  const t = useTranslations("userWorkplace");
  const toast = useAppToast();
  const { data: workplaces, isPending } = useWorkplaces();
  const acceptInvite = useAcceptWorkplaceInvitation();
  const declineInvite = useDeclineWorkplaceInvitation();

  const pending = (workplaces ?? []).filter(
    (w) => w.status === "invited",
  );

  if (isPending) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (pending.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noInvitations")}</p>;
  }

  async function handleAccept(id: string) {
    try {
      await acceptInvite.mutateAsync(id);
      toast.success(t("invitationAccepted"));
    } catch {
      toast.error(t("invitationAcceptFailed"));
    }
  }

  async function handleDecline(id: string) {
    try {
      await declineInvite.mutateAsync(id);
      toast.success(t("invitationDeclined"));
    } catch {
      toast.error(t("invitationDeclineFailed"));
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {pending.map((workplace) => (
        <div
          key={workplace.workplaceRelationshipId ?? workplace.roleProfileId}
          className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{workplace.profileName ?? t("unknownWorkplace")}</span>
              <Badge variant="secondary">{workplace.roleType}</Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              {t("hierarchyLevel")}: {workplace.hierarchyLevel ?? t("unknownRole")}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={acceptInvite.isPending || declineInvite.isPending}
              onClick={() => void handleDecline(workplace.workplaceRelationshipId ?? "")}
            >
              <X className="mr-1 size-3" aria-hidden />
              {t("decline")}
            </Button>
            <Button
              size="sm"
              disabled={acceptInvite.isPending || declineInvite.isPending}
              onClick={() => void handleAccept(workplace.workplaceRelationshipId ?? "")}
            >
              <Check className="mr-1 size-3" aria-hidden />
              {t("accept")}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
