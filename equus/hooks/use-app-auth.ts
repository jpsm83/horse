"use client";

import { useAppAuthContext } from "@/components/providers/app-auth-provider.tsx";
import type { AuthUser } from "@/lib/auth/types.ts";

export type AppAuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
};

/** Shared auth state for the global header — one provider load per app session. */
export function useAppAuth(): AppAuthState {
  return useAppAuthContext();
}
