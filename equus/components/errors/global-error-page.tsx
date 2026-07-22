/**
 * Root layout failure UI — no providers or i18n (replaces root layout on crash).
 */

"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
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
            <Button type="button" className="w-full" onClick={reset}>
              Try again
            </Button>
          </div>
        </main>
      </body>
    </html>
  );
}
