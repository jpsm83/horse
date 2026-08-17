"use client";

/**
 * Single app-wide REST auth state — header, home, banners share one load cycle.
 * Mounted once in `AppProviders`; consumers use `useAppAuth()`.
 */

import { useSession } from "next-auth/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useRouter } from "@/i18n/navigation.ts";
import {
  ensureRestSession,
  subscribeAuthStateChanged,
} from "@/lib/api/auth/session";
import { clearClientAuthSession } from "@/lib/auth/clearClientAuthSession.ts";
import { GUEST_LANDING_PATH } from "@/lib/navigation/postAuthRedirect.ts";
import { appToast } from "@/lib/ui/toast.ts";
import type { AuthUser } from "@/lib/auth/types.ts";
import type { AppAuthState } from "@/hooks/use-app-auth.ts";
import { applyThemeToDocument, syncThemeCookie } from "@/lib/theme/appTheme.ts";

const AppAuthContext = createContext<AppAuthState | null>(null);

export function AppAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [authRevision, setAuthRevision] = useState(0);
  const [hasEverResolvedUser, setHasEverResolvedUser] = useState(false);

  const nextAuthUserId =
    sessionStatus === "authenticated" ? session?.user?.id : undefined;

  const loadAuthState = useCallback(async () => {
    try {
      const currentUser = await ensureRestSession({
        nextAuthUserId,
      });
      setUser(currentUser);
      if (currentUser) setHasEverResolvedUser(true);
    } catch (err) {
      console.error("Auth session load failed:", err);
      appToast.error("Failed to connect to server");
      setUser(null);
    }
  }, [nextAuthUserId]);

  useEffect(
    () =>
      subscribeAuthStateChanged(() => {
        setAuthRevision((revision) => revision + 1);
      }),
    [],
  );

  useEffect(() => {
    if (sessionStatus === "loading" || isLoggingOut) return;

    let cancelled = false;

    void (async () => {
      if (!hasEverResolvedUser) {
        setIsLoading(true);
      }
      try {
        await loadAuthState();
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadAuthState, sessionStatus, authRevision, isLoggingOut]);

  const logout = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      router.replace(GUEST_LANDING_PATH);
      await clearClientAuthSession();
      setUser(null);
      setHasEverResolvedUser(false);
      applyThemeToDocument("default");
      syncThemeCookie("default");
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, router]);

  const value = useMemo<AppAuthState>(
    () => ({
      user,
      isAuthenticated: user !== null,
      // Do not treat NextAuth "loading" as app-unauthenticated when we already have a REST user.
      isLoading:
        (sessionStatus === "loading" && user === null) ||
        isLoading ||
        isLoggingOut,
      logout,
    }),
    [user, sessionStatus, isLoading, isLoggingOut, logout],
  );

  return <AppAuthContext.Provider value={value}>{children}</AppAuthContext.Provider>;
}

export function useAppAuthContext(): AppAuthState {
  const value = useContext(AppAuthContext);
  if (!value) {
    throw new Error("useAppAuth must be used within AppAuthProvider");
  }
  return value;
}
