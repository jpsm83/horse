/**
 * App-wide client error boundary — wraps the locale UI tree via AppProviders.
 *
 * Resets automatically on route changes so a recovered navigation clears the fallback.
 */

"use client";

import { ErrorBoundary } from "react-error-boundary";

import { ErrorFallback } from "@/components/errors/error-fallback.tsx";
import { usePathname } from "@/i18n/navigation.ts";

type AppErrorBoundaryProps = {
  children: React.ReactNode;
};

export function AppErrorBoundary({ children }: AppErrorBoundaryProps) {
  const pathname = usePathname();

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} resetKeys={[pathname]}>
      {children}
    </ErrorBoundary>
  );
}
