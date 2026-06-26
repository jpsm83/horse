"use client";

import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/icons/google-icon";

type GoogleSignInButtonProps = {
  disabled?: boolean;
  onError?: (message: string) => void;
};

export function GoogleSignInButton({ disabled, onError }: GoogleSignInButtonProps) {
  const t = useTranslations("auth.google");
  const tCommon = useTranslations("common");
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    setIsLoading(true);

    try {
      await signIn("google", { callbackUrl: "/" });
    } catch {
      onError?.(t("failed"));
      setIsLoading(false);
    }
  }

  return (
    <>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">{tCommon("or")}</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        onClick={handleClick}
        disabled={disabled || isLoading}
      >
        <GoogleIcon size={18} />
        {isLoading ? tCommon("loading") : t("continue")}
      </Button>
    </>
  );
}
