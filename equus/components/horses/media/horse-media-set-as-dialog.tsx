/**
 * HorseMediaSetAsDialog — choose "Set as profile / hero" for a media item.
 *
 * Composes the shared PendingDialog (blocking Dialog shell): dismissal is blocked
 * and a centered Spinner shows while the PATCH runs — matching Connect Invite /
 * Documents Upload / Admin role invite behavior.
 */

"use client";

import { PanelTop, UserCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { PendingDialog } from "@/components/shared/pending-dialog.tsx";
import { Button } from "@/components/ui/button.tsx";

type HorseMediaSetAsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onSetAsProfile: () => void;
  onSetAsHero: () => void;
};

export function HorseMediaSetAsDialog({
  open,
  onOpenChange,
  isPending,
  onSetAsProfile,
  onSetAsHero,
}: HorseMediaSetAsDialogProps) {
  const t = useTranslations("horseMedia");
  const tCommon = useTranslations("common");

  return (
    <PendingDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("setAsConfirmTitle")}
      description={t("setAsConfirmDescription")}
      pending={isPending}
    >
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          disabled={isPending}
          onClick={onSetAsProfile}
          className="w-full"
        >
          <UserCircle className="size-4" aria-hidden />
          {t("setAsProfile")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={isPending}
          onClick={onSetAsHero}
          className="w-full"
        >
          <PanelTop className="size-4" aria-hidden />
          {t("setAsHero")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={isPending}
          onClick={() => onOpenChange(false)}
        >
          {tCommon("cancel")}
        </Button>
      </div>
    </PendingDialog>
  );
}
