"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";

import { AppAuthProvider } from "@/components/providers/app-auth-provider.tsx";
import { AppErrorBoundary } from "@/components/errors/app-error-boundary.tsx";
import { AuthSessionProvider } from "@/components/providers/auth-session-provider.tsx";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            retry: 1,
            refetchOnWindowFocus: true,
          },
        },
      }),
  );

  return (
    <AppErrorBoundary>
      <SessionProvider>
        <AuthSessionProvider>
          <AppAuthProvider>
            <QueryClientProvider client={queryClient}>
              <TooltipProvider>
                {children}
                <Toaster position="bottom-right" richColors />
              </TooltipProvider>
            </QueryClientProvider>
          </AppAuthProvider>
        </AuthSessionProvider>
      </SessionProvider>
    </AppErrorBoundary>
  );
}
