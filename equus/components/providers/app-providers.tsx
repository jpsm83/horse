"use client";

import { SessionProvider } from "next-auth/react";

import { AppAuthProvider } from "@/components/providers/app-auth-provider.tsx";
import { AppErrorBoundary } from "@/components/errors/app-error-boundary.tsx";
import { AuthSessionProvider } from "@/components/providers/auth-session-provider.tsx";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AppErrorBoundary>
      <SessionProvider>
        <AuthSessionProvider>
          <AppAuthProvider>
            <TooltipProvider>
              {children}
              <Toaster position="bottom-right" richColors />
            </TooltipProvider>
          </AppAuthProvider>
        </AuthSessionProvider>
      </SessionProvider>
    </AppErrorBoundary>
  );
}
