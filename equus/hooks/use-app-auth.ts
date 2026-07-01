"use client";

import { useAppAuthContext } from "@/components/providers/app-auth-provider.tsx";
import type { UserOwnedNavigation } from "@/lib/api/authClient.ts";
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

/** Shared auth state for the global header — one provider load per app session. */
export function useAppAuth(): AppAuthState {
  return useAppAuthContext();
}
