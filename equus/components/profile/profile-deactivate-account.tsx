"use client";

/**
 * Account deactivation on `/profile` — confirm dialog, `DELETE /api/v1/users/me`, sign-in redirect.
 * Tombstones the user document; does not hard-delete. See `documentation/profile.md`.
 */

import { getSession, signOut } from "next-auth/react";
import { UserX } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FieldGroup,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
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
    <>
      <hr className="my-4" />

      <FieldSet>
        <FieldLegend className="pb-3 font-semibold">
          {t("sections.account")}
        </FieldLegend>
        <FieldGroup>
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
          </div>
        </FieldGroup>
      </FieldSet>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!isDeactivating) {
            setDialogOpen(open);
          }
        }}
      >
        <DialogContent showCloseButton={!isDeactivating}>
          <DialogHeader>
            <DialogTitle>{t("deactivateDialogTitle")}</DialogTitle>
            <DialogDescription>{t("deactivateDialogDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isDeactivating}
              onClick={() => setDialogOpen(false)}
            >
              {t("deactivateCancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeactivating}
              onClick={() => void handleConfirmDeactivate()}
            >
              {isDeactivating ? t("deactivateSubmitting") : t("deactivateConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
