"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { UserPlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useOwnerHorse } from "@/hooks/queries/useHorse.ts";
import { useCreateOwnershipTransfer } from "@/hooks/queries/useOwnershipTransfer.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";

type CoOwnerManagementSectionProps = {
  horseId: string;
};

export function CoOwnerManagementSection({ horseId }: CoOwnerManagementSectionProps) {
  const t = useTranslations("horseAdmin");
  const toast = useAppToast();
  const { data: horse, isPending } = useOwnerHorse(horseId);
  const createTransfer = useCreateOwnershipTransfer();

  const [email, setEmail] = useState("");

  if (isPending || !horse) {
    return <Skeleton className="h-32 w-full rounded-lg" />;
  }

  if (!horse.isMainOwner) return null;

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    createTransfer.mutate(
      { entityType: "horse", entityId: horseId, transferKind: "promote_co_owner", invitedEmail: email.trim() },
      { onSuccess: () => { toast.success(t("coOwnerInvited")); setEmail(""); }, onError: () => toast.error(t("inviteFailed")) },
    );
  }

  function handleRemove(userId: string) {
    createTransfer.mutate(
      { entityType: "horse", entityId: horseId, transferKind: "remove_co_owner", targetCoOwnerUserId: userId },
      { onSuccess: () => toast.success(t("coOwnerRemoved")), onError: () => toast.error(t("removeFailed")) },
    );
  }

  const coOwners = horse.coOwners ?? [];

  return (
    <div className="space-y-4">
      <form className="flex gap-2" onSubmit={handleInvite}>
        <Input type="email" placeholder={t("coOwnerEmailPlaceholder")} value={email}
          onChange={(e) => setEmail(e.target.value)} className="h-9" />
        <Button type="submit" size="sm" disabled={!email.trim() || createTransfer.isPending}>
          <UserPlus className="mr-1 h-3 w-3" />{t("inviteCoOwner")}
        </Button>
      </form>
      {coOwners.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noCoOwners")}</p>
      ) : (
        <ul className="divide-y divide-border">
          {coOwners.map((c) => (
            <li key={c.userId} className="flex items-center justify-between py-2">
              <div>
                <span className="text-sm font-medium">{c.label}</span>
                <span className="ml-2 text-xs text-muted-foreground">{c.ownershipPercentage}%</span>
              </div>
              <Button size="sm" variant="outline" onClick={() => handleRemove(c.userId)}>
                <X className="mr-1 h-3 w-3" />{t("removeCoOwner")}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
