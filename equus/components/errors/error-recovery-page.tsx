/**
 * Shared full-page error recovery UI — used by react-error-boundary and Next.js error.tsx.
 */

"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { AuthAwareStatusActions } from "@/components/status/auth-aware-status-actions.tsx";
import { StatusPageShell } from "@/components/status/status-page-shell.tsx";
import { Button } from "@/components/ui/button.tsx";
import { logClientError } from "@/lib/errors/logClientError.ts";
import type { ClientErrorSource } from "@/lib/errors/types.ts";

type ErrorRecoveryPageProps = {
  error: Error & { digest?: string };
  onRetry: () => void;
  source: ClientErrorSource;
  componentStack?: string | null;
};

export function ErrorRecoveryPage({
  error,
  onRetry,
  source,
  componentStack,
}: ErrorRecoveryPageProps) {
  const t = useTranslations("status.error");
  const tCommon = useTranslations("common");

  useEffect(() => {
    logClientError(error, {
      source,
      componentStack,
      digest: error.digest,
    });
  }, [componentStack, error, source]);

  return (
    <StatusPageShell title={t("title")} description={t("description")}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button type="button" className="w-full sm:w-auto" onClick={onRetry}>
            {tCommon("tryAgain")}
          </Button>
        </div>
        <AuthAwareStatusActions />
      </div>
    </StatusPageShell>
  );
}
