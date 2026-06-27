"use client";

import { SessionProvider } from "next-auth/react";

import { AuthSessionProvider } from "@/components/providers/auth-session-provider.tsx";
import { GoogleSessionBridge } from "@/components/providers/google-session-bridge.tsx";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthSessionProvider>
        <GoogleSessionBridge />
        <TooltipProvider>
          {children}
          <Toaster position="bottom-right" richColors />
        </TooltipProvider>
      </AuthSessionProvider>
    </SessionProvider>
  );
}
