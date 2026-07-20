"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { UserInviteSection } from "@/components/horses/shared/user-invite-section.tsx";
import { useOwnerHorse } from "@/hooks/queries/useHorse.ts";
import { useEntitySearch } from "@/hooks/queries/useEntitySearch.ts";
import { useCreateOwnershipTransfer } from "@/hooks/queries/useOwnershipTransfer.ts";
import { useDebouncedValue } from "@/hooks/use-debounced-value.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";

type OwnershipManagementSectionProps = {
  horseId: string;
};

export function OwnershipManagementSection({ horseId }: OwnershipManagementSectionProps) {
  const t = useTranslations("horseAdmin");
  const toast = useAppToast();
  const { data: horse, isPending } = useOwnerHorse(horseId);
  const createTransfer = useCreateOwnershipTransfer();

  const [query, setQuery] = useState("");
  const [showEmailFallback, setShowEmailFallback] = useState(false);
  const [pendingInvite, setPendingInvite] = useState<{ userId?: string; email?: string; name?: string } | null>(null);

  const debouncedQuery = useDebouncedValue(query, 300);
  const { data: results = [], isLoading: isSearching, error: searchError } = useEntitySearch(debouncedQuery);

  if (isPending || !horse) {
    return <Skeleton className="h-32 w-full rounded-lg" />;
  }

  if (!horse.isMainOwner) return null;

  function handleInviteUser(userId: string) {
    setPendingInvite({ userId });
  }

  function handleEmailInvite(email: string, name?: string) {
    setPendingInvite({ email, name });
  }

  function handleConfirmTransfer() {
    if (!pendingInvite) return;

    if (pendingInvite.userId) {
      createTransfer.mutate(
        { entityType: "horse", entityId: horseId, transferKind: "transfer_main", receiverUserId: pendingInvite.userId },
        {
          onSuccess: () => {
            toast.success(t("ownershipTransferSent"));
            setQuery("");
            setPendingInvite(null);
          },
          onError: () => toast.error(t("inviteFailed")),
        },
      );
    } else {
      createTransfer.mutate(
        { entityType: "horse", entityId: horseId, transferKind: "transfer_main", invitedEmail: pendingInvite.email, invitedName: pendingInvite.name },
        {
          onSuccess: () => {
            toast.success(t("ownershipTransferSent"));
            setQuery("");
            setShowEmailFallback(false);
            setPendingInvite(null);
          },
          onError: () => toast.error(t("inviteFailed")),
        },
      );
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">{t("ownershipTransferWarning")}</p>

      <UserInviteSection
        query={query}
        onQueryChange={setQuery}
        results={results}
        isSearching={isSearching}
        searchError={searchError}
        onInviteUser={handleInviteUser}
        onEmailInvite={handleEmailInvite}
        isInviting={createTransfer.isPending}
        showEmailFallback={showEmailFallback}
        onShowEmailFallback={setShowEmailFallback}
        labels={{
          searchPlaceholder: t("searchPlaceholder"),
          inviteLabel: t("transferOwnership"),
          searchingLabel: t("searchingLabel"),
          searchErrorLabel: t("searchErrorLabel"),
          noResultsLabel: t("noResultsLabel"),
          emailFallbackToggle: t("emailFallbackToggle"),
          emailFallbackHint: t("emailFallbackHint"),
          emailLabel: t("emailLabel"),
          nameLabel: t("nameLabel"),
          sendEmailInvite: t("sendEmailInvite"),
          cancelLabel: t("cancel"),
        }}
      />

      <AlertDialog open={pendingInvite !== null} onOpenChange={(open) => { if (!open) setPendingInvite(null); }}>
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
