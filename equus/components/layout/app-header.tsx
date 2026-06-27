"use client";

import { DiscoverMobileMenu } from "@/components/layout/discover-mobile-menu.tsx";
import { UserMenu } from "@/components/layout/user-menu.tsx";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { Link } from "@/i18n/navigation.ts";

/** Sticky global header — centered brand on mobile; user menu; discover on mobile only. */
export function AppHeader() {
  const auth = useAppAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-secondary/95 backdrop-blur supports-backdrop-filter:bg-secondary/85">
      <div className="relative flex h-14 items-center justify-end px-4">
        <div className="absolute left-4 flex items-center md:hidden">
          <DiscoverMobileMenu />
        </div>
        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2 text-2xl font-bold text-card-foreground md:hidden"
        >
          Equus
        </Link>
        <div className="flex items-center gap-2">
          <UserMenu auth={auth} />
        </div>
      </div>
    </header>
  );
}
