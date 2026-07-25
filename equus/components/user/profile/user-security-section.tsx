/**
 * UserSecuritySection — password set/change via email link.
 *
 * Immediate action (not part of the deferred profile form).
 * Extracted from ProfileForm to be a standalone section component.
 */

"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button.tsx";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { requestPasswordResetForCurrentUser } from "@/lib/api/auth/credentials";

type Props = {
  hasPassword: boolean;
  authProvider: string;
};

export function UserSecuritySection({ hasPassword, authProvider }: Props) {
  const t = useTranslations("profile");
  const toast = useAppToast();
  const [isRequesting, setIsRequesting] = useState(false);

  async function handlePasswordEmail() {
    setIsRequesting(true);
    try {
      await requestPasswordResetForCurrentUser();
    } catch {
      toast.error(t("passwordEmailFailed"));
    } finally {
      setIsRequesting(false);
    }
  }

  if (authProvider === "google" && !hasPassword) {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          disabled={isRequesting}
          onClick={() => void handlePasswordEmail()}
        >
          <Lock className="size-4" aria-hidden />
          {t("passwordSet")}
        </Button>
        <p className="text-sm text-muted-foreground">{t("passwordSetDescription")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <Button
        type="button"
        variant="outline"
        className="w-full sm:w-auto"
        disabled={isRequesting}
        onClick={() => void handlePasswordEmail()}
      >
        <Lock className="size-4" aria-hidden />
        {hasPassword ? t("passwordChange") : t("passwordSet")}
      </Button>
      <p className="text-sm text-muted-foreground">
        {hasPassword ? t("passwordChangeDescription") : t("passwordSetDescription")}
      </p>
    </div>
  );
}
