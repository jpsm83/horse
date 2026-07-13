"use client";

import { useState } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar.tsx";
import { IncompleteProfileBanner } from "@/components/layout/incomplete-profile-banner.tsx";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile.ts";

type AppShellProps = {
  children: React.ReactNode;
};

/** App chrome — sidebar (all nav + user menu) + page content. */
export function AppShell({ children }: AppShellProps) {
  const isMobile = useIsMobile();
  const [sidebarHovered, setSidebarHovered] = useState(false);

  return (
    <SidebarProvider
      defaultOpen={false}
      open={isMobile ? false : sidebarHovered}
      onOpenChange={(open) => {
        if (!isMobile) {
          setSidebarHovered(open);
        }
      }}
    >
      <AppSidebar onHoverChange={setSidebarHovered} />
      <SidebarInset className="flex min-h-svh flex-1 flex-col">
        {/* Mobile-only trigger bar */}
        <div className="flex h-14 items-center gap-2 border-b px-4 md:hidden">
          <SidebarTrigger />
          <span className="text-lg font-semibold">Equus</span>
        </div>
        <IncompleteProfileBanner />
        <div className="flex flex-1 flex-col px-10">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
