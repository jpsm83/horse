/**
 * Root layout failure UI — no providers or i18n (replaces root layout on crash).
 */

"use client";

import { useEffect } from "react";

import { logClientError } from "@/lib/errors/logClientError.ts";

type GlobalErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export function GlobalErrorPage({ error, reset }: GlobalErrorPageProps) {
  useEffect(() => {
    logClientError(error, {
      source: "global-error",
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-svh bg-background font-sans text-foreground antialiased">
        <main className="flex min-h-svh flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-md space-y-4 rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
            <h1 className="text-xl font-semibold">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">
              Equus could not load the application. Please try again.
            </p>
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
