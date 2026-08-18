"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";

import { AppAuthProvider } from "@/components/providers/app-auth-provider.tsx";
import { ChatPopoverProvider } from "@/components/chat/chat-popover-provider.tsx";
import { useChatSocketSubscription } from "@/hooks/use-chat-socket.ts";
import { AppThemeSync } from "@/components/providers/app-theme-sync.tsx";
import { AppErrorBoundary } from "@/components/errors/app-error-boundary.tsx";
import { AuthSessionProvider } from "@/components/providers/auth-session-provider.tsx";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

function ChatRealtimeBridge({ children }: { children: React.ReactNode }) {
  useChatSocketSubscription();
  return <>{children}</>;
}

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
            <AppThemeSync />
            <QueryClientProvider client={queryClient}>
              <TooltipProvider>
                <ChatPopoverProvider>
                  <ChatRealtimeBridge>{children}</ChatRealtimeBridge>
                </ChatPopoverProvider>
                <Toaster position="bottom-right" richColors />
              </TooltipProvider>
            </QueryClientProvider>
          </AppAuthProvider>
        </AuthSessionProvider>
      </SessionProvider>
    </AppErrorBoundary>
  );
}
