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
  fetchUserNavigation,
  fetchUserProfile,
  subscribeAuthStateChanged,
  type UserOwnedNavigation,
} from "@/lib/api/authClient.ts";
import { clearClientAuthSession } from "@/lib/auth/clearClientAuthSession.ts";
import { GUEST_LANDING_PATH } from "@/lib/navigation/postAuthRedirect.ts";
import type { AuthUser } from "@/lib/auth/types.ts";
import type { AppAuthProfile, AppAuthState } from "@/hooks/use-app-auth.ts";

const AppAuthContext = createContext<AppAuthState | null>(null);

function readProfileFields(
  personalDetails: Record<string, unknown> | undefined,
): AppAuthProfile {
  if (!personalDetails) return {};
  return {
    firstName:
      typeof personalDetails.firstName === "string"
        ? personalDetails.firstName
        : undefined,
    lastName:
      typeof personalDetails.lastName === "string"
        ? personalDetails.lastName
        : undefined,
    imageUrl:
      typeof personalDetails.imageUrl === "string"
        ? personalDetails.imageUrl
        : undefined,
  };
}

function buildDisplayName(profile: AppAuthProfile | null, email: string): string {
  const parts = [profile?.firstName, profile?.lastName].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(" ");
  }
  return email;
}

export function AppAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<AppAuthProfile | null>(null);
  const [ownedNavigation, setOwnedNavigation] = useState<UserOwnedNavigation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [authRevision, setAuthRevision] = useState(0);

  const nextAuthUserId =
    sessionStatus === "authenticated" ? session?.user?.id : undefined;

  const loadAuthState = useCallback(async () => {
    try {
      const currentUser = await ensureRestSession({
        nextAuthUserId,
      });
      setUser(currentUser);

      if (!currentUser) {
        setProfile(null);
        setOwnedNavigation(null);
        return;
      }

      const [profileResult, navigationResult] = await Promise.all([
        fetchUserProfile(),
        fetchUserNavigation(),
      ]);

      const details = profileResult.user.personalDetails as Record<string, unknown>;
      setProfile(readProfileFields(details));
      setOwnedNavigation(navigationResult);
    } catch {
      setUser(null);
      setProfile(null);
      setOwnedNavigation(null);
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

    void (async () => {
      setIsLoading(true);
      try {
        await loadAuthState();
      } finally {
        setIsLoading(false);
      }
    })();
  }, [loadAuthState, sessionStatus, authRevision, isLoggingOut]);

  const logout = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      router.replace(GUEST_LANDING_PATH);
      await clearClientAuthSession();
      setUser(null);
      setProfile(null);
      setOwnedNavigation(null);
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, router]);

  const value = useMemo<AppAuthState>(() => {
    const displayName = user ? buildDisplayName(profile, user.email) : null;
    const profileImageUrl = profile?.imageUrl?.trim() || null;

    return {
      user,
      profile,
      ownedNavigation,
      isAuthenticated: user !== null,
      isLoading: sessionStatus === "loading" || isLoading || isLoggingOut,
      displayName,
      profileImageUrl,
      logout,
    };
  }, [user, profile, ownedNavigation, sessionStatus, isLoading, isLoggingOut, logout]);

  return <AppAuthContext.Provider value={value}>{children}</AppAuthContext.Provider>;
}

export function useAppAuthContext(): AppAuthState {
  const value = useContext(AppAuthContext);
  if (!value) {
    throw new Error("useAppAuth must be used within AppAuthProvider");
  }
  return value;
}
