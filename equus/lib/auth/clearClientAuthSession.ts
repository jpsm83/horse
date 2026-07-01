"use client";

/**
 * Clears REST auth cookies and the NextAuth session without redirecting.
 * Used by password reset (email link) and shared logout flows.
 *
 * NextAuth is cleared first so `ensureRestSession` cannot re-bridge while REST cookies are removed.
 * Session-expired redirects are suppressed so logout never races into `/signin`.
 */

import { getSession, signOut } from "next-auth/react";

import {
  logoutFromApi,
  resetOptionalUserCache,
  runWithSilentAuthFailure,
  runWithSuppressedSessionExpired,
} from "@/lib/api/authClient.ts";

export async function clearClientAuthSession(): Promise<void> {
  await runWithSuppressedSessionExpired(async () => {
    try {
      const session = await getSession();
      if (session) {
        await signOut({ redirect: false });
      }
    } catch {
      // Best effort — logout must continue.
    }

    try {
      await runWithSilentAuthFailure(() => logoutFromApi());
    } catch {
      // Already logged out or cookies missing.
    }

    resetOptionalUserCache();
  });
}
