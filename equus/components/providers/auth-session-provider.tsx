"use client";

/**
 * Registers the client-side session-expired handler (redirect + toast).
 * Mounted once inside the locale layout via AppProviders.
 */

import { useEffect } from "react";

import { useAppToast } from "@/hooks/use-app-toast.ts";
import { usePathname, useRouter } from "@/i18n/navigation.ts";
import { setSessionExpiredHandler } from "@/lib/api/auth/session";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { actionFailed } = useAppToast();

  useEffect(() => {
    setSessionExpiredHandler(() => {
      actionFailed();
      if (pathname.startsWith("/signin")) {
        return;
      }
      router.replace(buildSignInPath(pathname));
    });

    return () => setSessionExpiredHandler(null);
  }, [actionFailed, pathname, router]);

  return children;
}
