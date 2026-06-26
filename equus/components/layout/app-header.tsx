"use client";

import { DiscoverMobileMenu } from "@/components/layout/discover-mobile-menu.tsx";
import { UserMenu } from "@/components/layout/user-menu.tsx";
import { LocaleSwitcher } from "@/components/locale-switcher.tsx";
import { useAppAuth } from "@/hooks/use-app-auth.ts";

/** Sticky global header — locale switcher and user menu; discover on mobile only. */
export function AppHeader() {
  const auth = useAppAuth();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center">
          <div className="md:hidden">
            <DiscoverMobileMenu />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LocaleSwitcher isAuthenticated={auth.isAuthenticated} />
          <UserMenu auth={auth} />
        </div>
      </div>
    </header>
  );
}
