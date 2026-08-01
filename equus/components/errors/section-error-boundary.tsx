/**
 * SectionErrorBoundary — isolated error boundary for a data-dependent section.
 *
 * Composes react-error-boundary with the app's standard inline fallback and
 * logging: every caught section crash is reported through logClientError (the
 * single client error-reporting channel) and the boundary can auto-reset on key
 * changes (e.g. entity id) — mirroring AppErrorBoundary's resetKeys behavior at
 * section scope. Pass `message` for user-facing copy so raw Error.message is
 * never shown to end users; the full error is logged instead.
 *
 * Usage: replace hand-rolled <ErrorBoundary fallbackRender={...}> blocks around
 * section children in page client.tsx assemblies.
 */

"use client";

import type { ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { InlineErrorFallback } from "@/components/errors/inline-error-fallback.tsx";
import { logClientError } from "@/lib/errors/logClientError.ts";

type SectionErrorBoundaryProps = {
  children: ReactNode;
  /** Keys that reset the boundary when they change (e.g. entity id). */
  resetKeys?: unknown[];
  /** User-facing fallback message (translated). Raw error details are logged only. */
  message?: string;
};

export function SectionErrorBoundary({
  children,
  resetKeys,
  message,
}: SectionErrorBoundaryProps) {
  return (
    <ErrorBoundary
      resetKeys={resetKeys}
      fallbackRender={({ error, resetErrorBoundary }) => (
        <InlineErrorFallback
          error={error}
          resetErrorBoundary={resetErrorBoundary}
          message={message}
        />
      )}
      onError={(error, info) =>
        logClientError(error, {
          source: "error-boundary",
          componentStack: info.componentStack,
        })
      }
    >
      {children}
    </ErrorBoundary>
  );
}
