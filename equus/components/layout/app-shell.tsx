"use client";

import { useState } from "react";

import { AppHeader } from "@/components/layout/app-header.tsx";
import { DiscoverSidebar } from "@/components/layout/discover-sidebar.tsx";
import { useIsMobile } from "@/hooks/use-mobile.ts";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

type AppShellProps = {
  children: React.ReactNode;
};

/** App chrome — discover sidebar (desktop) + header + page content. */
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
      <DiscoverSidebar onHoverChange={setSidebarHovered} />
      <SidebarInset className="flex min-h-svh flex-1 flex-col">
        <AppHeader />
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
