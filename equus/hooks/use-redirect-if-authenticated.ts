/**
 * Redirect authenticated users away from guest-only auth pages (sign-in, sign-up).
 */

import { useEffect } from "react";

import { useRouter } from "@/i18n/navigation.ts";
import { useAppAuth } from "@/hooks/use-app-auth.ts";

export function useRedirectIfAuthenticated(destination: string): void {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAppAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(destination);
    }
  }, [destination, isAuthenticated, isLoading, router]);
}
