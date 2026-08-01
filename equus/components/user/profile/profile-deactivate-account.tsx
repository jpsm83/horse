"use client";

/**
 * Account deactivation on `/profile` — confirm dialog (shared ConfirmActionDialog),
 * `DELETE /api/v1/users/me`, sign-in redirect.
 * Tombstones the user document; does not hard-delete. See `documentation/profile.md`.
 */

import { getSession, signOut } from "next-auth/react";
import { UserX } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog.tsx";
import { useRouter } from "@/i18n/navigation.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { deactivateCurrentUserAccount } from "@/lib/api/auth/profile";
import { isApiClientError } from "@/lib/api/auth/session";

type ProfileDeactivateAccountProps = {
  onDeactivatingChange?: (active: boolean) => void;
};

export function ProfileDeactivateAccount({
  onDeactivatingChange,
}: ProfileDeactivateAccountProps) {
  const router = useRouter();
  const t = useTranslations("profile");
  const toast = useAppToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  async function handleConfirmDeactivate(): Promise<void> {
    setIsDeactivating(true);
    onDeactivatingChange?.(true);

    try {
      await deactivateCurrentUserAccount();

      try {
        const session = await getSession();
        if (session) {
          await signOut({ redirect: false });
        }
      } catch {
        // Best effort — account is already deactivated and REST cookies cleared.
      }

      toast.success(t("deactivateSuccess"));
      router.replace("/signin");
    } catch (error) {
      const message = isApiClientError(error) ? error.message : t("deactivateFailed");
      toast.error(message);
      setDialogOpen(false);
    } finally {
      setIsDeactivating(false);
      onDeactivatingChange?.(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <Button
        type="button"
        variant="destructive"
        className="w-full sm:w-auto"
        disabled={isDeactivating}
        onClick={() => setDialogOpen(true)}
      >
        <UserX className="size-4" aria-hidden />
        {t("deactivateAccount")}
      </Button>
      <p className="text-sm text-muted-foreground">{t("deactivateDescription")}</p>

      <ConfirmActionDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!isDeactivating) setDialogOpen(open);
        }}
        title={t("deactivateDialogTitle")}
        description={t("deactivateDialogDescription")}
        confirmLabel={isDeactivating ? t("deactivateSubmitting") : t("deactivateConfirm")}
        cancelLabel={t("deactivateCancel")}
        isPending={isDeactivating}
        variant="destructive"
        onConfirm={() => void handleConfirmDeactivate()}
      />
    </div>
  );
}
