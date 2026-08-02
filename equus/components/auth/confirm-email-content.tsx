/**
 * ConfirmEmailContent — token confirmation flow for `/confirm-email`.
 *
 * Receives `token` from `ConfirmEmailClient`. Runs the confirmation request in
 * a `useEffect` guarded by state (not a ref) so it fires once per token change,
 * and renders loading / success / error / missing states. Pure client
 * component — no search params, no refs.
 */

"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { AuthPageShell } from "@/components/auth/auth-page-shell.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation.ts";
import { confirmEmail } from "@/lib/api/auth/credentials";
import { cn } from "@/lib/utils";

type FlowState = "loading" | "success" | "error" | "missing";

type ConfirmEmailContentProps = {
  token: string | null;
};

export function ConfirmEmailContent({ token }: ConfirmEmailContentProps) {
  const t = useTranslations("auth.confirmEmail");
  const tCommon = useTranslations("common");
  const [state, setState] = useState<FlowState>(token ? "loading" : "missing");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token || state !== "loading") return;

    void (async () => {
      try {
        const result = await confirmEmail(token);
        setMessage(result.message);
        setState("success");
      } catch (err) {
        setMessage(err instanceof Error ? err.message : t("error"));
        setState("error");
      }
    })();
  }, [token, state, t]);

  const description =
    state === "loading"
      ? t("verifying")
      : state === "success"
        ? (message ?? t("success"))
        : state === "missing"
          ? t("missingToken")
          : (message ?? t("error"));

  return (
    <AuthPageShell
      title={t("title")}
      description={description}
      footer={
        state === "success" ? (
          <Link
            href="/signin"
            className={cn(buttonVariants({ variant: "link" }), "font-medium")}
          >
            {tCommon("signIn")}
          </Link>
        ) : state === "error" || state === "missing" ? (
          <Link
            href="/resend-confirmation"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {t("resend")}
          </Link>
        ) : (
          <span>{tCommon("loading")}</span>
        )
      }
    >
      {state === "loading" ? (
        <Alert>
          <AlertDescription>{t("verifying")}</AlertDescription>
        </Alert>
      ) : null}

      {state === "success" ? (
        <Link href="/signin" className={cn(buttonVariants(), "w-full")}>
          {tCommon("signIn")}
        </Link>
      ) : null}
    </AuthPageShell>
  );
}
