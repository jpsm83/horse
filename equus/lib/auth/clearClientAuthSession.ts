"use client";

/**
 * Clears REST auth cookies and the NextAuth session without redirecting.
 * Used by password reset (email link) and shared logout flows.
 */

import { getSession, signOut } from "next-auth/react";

import { logoutFromApi, runWithSilentAuthFailure } from "@/lib/api/authClient.ts";

export async function clearClientAuthSession(): Promise<void> {
  try {
    await runWithSilentAuthFailure(() => logoutFromApi());
  } catch {
    // Already logged out or cookies missing.
  }

  try {
    const session = await getSession();
    if (session) {
      await signOut({ redirect: false });
    }
  } catch {
    // Best effort — reset flow must continue.
  }
}
