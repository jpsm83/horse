"use client";

import { signOut, useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

import {
  fetchUserNavigation,
  fetchUserProfile,
  logoutFromApi,
  syncApiSession,
  tryFetchCurrentUser,
  type UserOwnedNavigation,
} from "@/lib/api/authClient.ts";
import type { AuthUser } from "@/lib/auth/types.ts";

export type AppAuthProfile = {
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
};

export type AppAuthState = {
  user: AuthUser | null;
  profile: AppAuthProfile | null;
  ownedNavigation: UserOwnedNavigation | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  displayName: string | null;
  profileImageUrl: string | null;
  logout: () => Promise<void>;
};

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

/** Shared auth state for the global header — REST session, profile, and owned nav flags. */
export function useAppAuth(): AppAuthState {
  const { data: session, status: sessionStatus } = useSession();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<AppAuthProfile | null>(null);
  const [ownedNavigation, setOwnedNavigation] = useState<UserOwnedNavigation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const loadAuthState = useCallback(async () => {
    try {
      if (session?.user?.id) {
        await syncApiSession();
      }

      const currentUser = await tryFetchCurrentUser(Boolean(session?.user?.id));
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
  }, [session?.user?.id]);

  useEffect(() => {
    if (sessionStatus === "loading") return;

    void (async () => {
      setIsLoading(true);
      try {
        await loadAuthState();
      } finally {
        setIsLoading(false);
      }
    })();
  }, [loadAuthState, sessionStatus]);

  const logout = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      await logoutFromApi();
      if (session) {
        await signOut({ callbackUrl: "/signin" });
        return;
      }
      setUser(null);
      setProfile(null);
      setOwnedNavigation(null);
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, session]);

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
}
