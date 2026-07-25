/**
 * UserRelationshipRequestsSection — incoming pending relationship requests.
 * Shows horse/entity name, requester, and Accept/Decline buttons.
 */

"use client";

import { useTranslations } from "next-intl";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  usePendingRelationships,
  useAcceptRelationship,
  useDeclineRelationship,
} from "@/hooks/queries";
import { useAppToast } from "@/hooks/use-app-toast.ts";

export function UserRelationshipRequestsSection() {
  const t = useTranslations("userRelationships");
  const toast = useAppToast();
  const { data: pending, isPending } = usePendingRelationships();
  const acceptRelationship = useAcceptRelationship();
  const declineRelationship = useDeclineRelationship();

  if (isPending) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const requests = (pending ?? []).filter((r) => r.status === "pending");

  if (requests.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noRequests")}</p>;
  }

  async function handleAccept(id: string) {
    try {
      await acceptRelationship.mutateAsync(id);
      toast.success(t("requestAccepted"));
    } catch {
      toast.error(t("requestAcceptFailed"));
    }
  }

  async function handleDecline(id: string) {
    try {
      await declineRelationship.mutateAsync(id);
      toast.success(t("requestDeclined"));
    } catch {
      toast.error(t("requestDeclineFailed"));
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {requests.map((request) => (
        <div
          key={request.id}
          className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{request.horseName ?? t("unknownHorse")}</span>
              <Badge variant="secondary">{request.relationshipType}</Badge>
            </div>
            {request.requesterLabel ? (
              <span className="text-xs text-muted-foreground">
                {t("fromLabel")}: {request.requesterLabel}
              </span>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={acceptRelationship.isPending || declineRelationship.isPending}
              onClick={() => void handleDecline(request.id)}
            >
              <X className="mr-1 size-3" aria-hidden />
              {t("decline")}
            </Button>
            <Button
              size="sm"
              disabled={acceptRelationship.isPending || declineRelationship.isPending}
              onClick={() => void handleAccept(request.id)}
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
