"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRightLeft } from "lucide-react";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useOwnerHorse } from "@/hooks/queries/useHorse.ts";
import { useCreateOwnershipTransfer } from "@/hooks/queries/useOwnershipTransfer.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";

type OwnershipManagementSectionProps = {
  horseId: string;
};

export function OwnershipManagementSection({ horseId }: OwnershipManagementSectionProps) {
  const t = useTranslations("horseAdmin");
  const toast = useAppToast();
  const { data: horse, isPending } = useOwnerHorse(horseId);
  const createTransfer = useCreateOwnershipTransfer();

  const [email, setEmail] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  if (isPending || !horse) {
    return <Skeleton className="h-32 w-full rounded-lg" />;
  }

  if (!horse.isMainOwner) return null;

  function handleRequestTransfer(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setShowConfirm(true);
  }

  function handleConfirmTransfer() {
    createTransfer.mutate(
      { entityType: "horse", entityId: horseId, transferKind: "transfer_main", invitedEmail: email.trim() },
      {
        onSuccess: () => {
          toast.success(t("ownershipTransferSent"));
          setEmail("");
          setShowConfirm(false);
        },
        onError: () => toast.error(t("inviteFailed")),
      },
    );
  }

  return (
    <div className="space-y-4">
      <form className="flex gap-2" onSubmit={handleRequestTransfer}>
        <Input type="email" placeholder={t("ownershipEmailPlaceholder")} value={email}
          onChange={(e) => setEmail(e.target.value)} className="h-9" />
        <Button type="submit" size="sm" disabled={!email.trim() || createTransfer.isPending}>
          <ArrowRightLeft className="mr-1 h-3 w-3" />{t("transferOwnership")}
        </Button>
      </form>

      <p className="text-xs text-muted-foreground">{t("ownershipTransferWarning")}</p>

      <AlertDialog open={showConfirm} onOpenChange={(open) => { if (!open) setShowConfirm(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("ownershipConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("ownershipConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmTransfer}
              disabled={createTransfer.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {createTransfer.isPending ? (
                <span className="flex items-center gap-1">
                  <span className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {t("transferring")}
                </span>
              ) : (
                t("confirmTransfer")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
