"use client";

import { GlobalErrorPage } from "@/components/errors/global-error-page.tsx";

import "./globals.css";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/** Root layout error boundary — replaces the entire document when the root layout fails. */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return <GlobalErrorPage error={error} reset={reset} />;
}
