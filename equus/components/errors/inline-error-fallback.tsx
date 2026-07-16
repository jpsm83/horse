/**
 * Inline error fallback — compact card for component-level ErrorBoundary wrappers.
 *
 * Use inside react-error-boundary's `fallbackRender` to handle a single section
 * failing without taking down the full page. For app-wide errors, use ErrorRecoveryPage.
 */

"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button.tsx";

type InlineErrorFallbackProps = {
  error: unknown;
  resetErrorBoundary: () => void;
  message?: string;
};

export function InlineErrorFallback({ error, resetErrorBoundary, message }: InlineErrorFallbackProps) {
  const t = useTranslations("common");

  const displayMessage = message ?? (error instanceof Error ? error.message : String(error));

  return (
    <div className="rounded-md border border-destructive/50 bg-destructive/5 p-4 text-center">
      <p className="text-sm text-muted-foreground">
        {displayMessage}
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={resetErrorBoundary}
        className="mt-2"
      >
        {t("tryAgain")}
      </Button>
    </div>
  );
}
