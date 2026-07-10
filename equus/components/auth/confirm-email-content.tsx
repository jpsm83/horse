"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { AuthPageShell } from "@/components/auth/auth-page-shell.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation.ts";
import { confirmEmail } from "@/lib/api/auth/credentials";
import { cn } from "@/lib/utils";

type FlowState = "loading" | "success" | "error" | "missing";

export function ConfirmEmailContent() {
  const searchParams = useSearchParams();
  const t = useTranslations("auth.confirmEmail");
  const tCommon = useTranslations("common");
  const token = searchParams.get("token");
  const [state, setState] = useState<FlowState>(token ? "loading" : "missing");
  const [message, setMessage] = useState<string | null>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (!token || submittedRef.current) return;
    submittedRef.current = true;

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
  }, [token, t]);

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
