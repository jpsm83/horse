"use client";

import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { AuthAwareStatusActions } from "@/components/status/auth-aware-status-actions.tsx";
import { StatusPageShell } from "@/components/status/status-page-shell.tsx";

type NotAllowedReason = "forbidden" | "wrong_account" | "email_unverified";

function NotAllowedContent() {
  const searchParams = useSearchParams();
  const t = useTranslations("status.notAllowed");
  const reason = searchParams.get("reason") as NotAllowedReason | null;

  const description =
    reason === "wrong_account"
      ? t("wrongAccount")
      : reason === "email_unverified"
        ? t("emailUnverified")
        : reason === "forbidden"
          ? t("forbidden")
          : t("description");

  return (
    <StatusPageShell title={t("title")} description={description}>
      <AuthAwareStatusActions />
    </StatusPageShell>
  );
}

export default function NotAllowedPage() {
  return (
    <Suspense fallback={null}>
      <NotAllowedContent />
    </Suspense>
  );
}
