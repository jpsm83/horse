/**
 * react-error-boundary fallback — recovers inside AppProviders (i18n + chrome available).
 */

"use client";

import type { FallbackProps } from "react-error-boundary";

import { ErrorRecoveryPage } from "@/components/errors/error-recovery-page.tsx";

function toError(value: unknown): Error & { digest?: string } {
  if (value instanceof Error) {
    return value;
  }

  return new Error(typeof value === "string" ? value : "Unknown error");
}

export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <ErrorRecoveryPage
      error={toError(error)}
      onRetry={resetErrorBoundary}
      source="error-boundary"
    />
  );
}
