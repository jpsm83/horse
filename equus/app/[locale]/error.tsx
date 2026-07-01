"use client";

import { LocaleErrorPage } from "@/components/errors/locale-error-page.tsx";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/** Locale segment error boundary — keeps AppShell chrome; translated recovery UI. */
export default function Error({ error, reset }: ErrorProps) {
  return <LocaleErrorPage error={error} reset={reset} />;
}
