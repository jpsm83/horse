/**
 * Client error logging — single place for boundary and route error reporting.
 *
 * Called by `AppErrorBoundary`, `app/[locale]/error.tsx`, and `app/global-error.tsx`.
 * Extend here when wiring external monitoring (Sentry, etc.).
 */

import type { ClientErrorContext } from "./types.ts";

export function logClientError(error: unknown, context: ClientErrorContext): void {
  const normalized = normalizeClientError(error);

  if (process.env.NODE_ENV !== "production") {
    console.error(`[${context.source}]`, normalized.message, {
      digest: context.digest,
      componentStack: context.componentStack,
      stack: normalized.stack,
    });
    return;
  }

  console.error(`[${context.source}]`, normalized.message, {
    digest: context.digest,
  });
}

function normalizeClientError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === "string") {
    return new Error(error);
  }

  return new Error("Unknown client error");
}
