"use client";

/**
 * "Home" link — guest landing (`/`) or signed-in hub (`/home`).
 * Use instead of hardcoding `href="/"` in footers and status pages.
 */

import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { Link } from "@/i18n/navigation.ts";
import { resolveAppHomePath } from "@/lib/navigation/postAuthRedirect.ts";
import { cn } from "@/lib/utils";

type AppHomeLinkProps = {
  children: React.ReactNode;
  className?: string;
};

export function AppHomeLink({ children, className }: AppHomeLinkProps) {
  const { isAuthenticated } = useAppAuth();

  return (
    <Link href={resolveAppHomePath(isAuthenticated)} className={cn(className)}>
      {children}
    </Link>
  );
}
