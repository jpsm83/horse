/**
 * Next.js App Router segment error UI — `app/[locale]/error.tsx` adapter.
 */

"use client";

import { ErrorRecoveryPage } from "@/components/errors/error-recovery-page.tsx";

type LocaleErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export function LocaleErrorPage({ error, reset }: LocaleErrorPageProps) {
  return <ErrorRecoveryPage error={error} onRetry={reset} source="route-error" />;
}
