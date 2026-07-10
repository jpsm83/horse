"use client";

import { useTranslations } from "next-intl";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { AuthPageShell } from "@/components/auth/auth-page-shell.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation.ts";
import { confirmEmail } from "@/lib/api/auth/credentials";
import { cn } from "@/lib/utils";

import type { Metadata } from "next";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/confirm-email", "metadata.confirmEmail");
}

type FlowState = "loading" | "success" | "error" | "missing";

function ConfirmEmailContent() {
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

export default function ConfirmEmailPage() {
  const t = useTranslations("auth.confirmEmail");
  const tCommon = useTranslations("common");

  return (
    <Suspense
      fallback={
        <AuthPageShell
          title={t("title")}
          description={tCommon("loading")}
          footer={<span>{tCommon("loading")}</span>}
        >
          <Alert>
            <AlertDescription>{tCommon("loading")}</AlertDescription>
          </Alert>
        </AuthPageShell>
      }
    >
      <ConfirmEmailContent />
    </Suspense>
  );
}
