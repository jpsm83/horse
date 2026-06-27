"use client";

/**
 * After Google OAuth, bridge NextAuth session to REST cookies once per sign-in.
 * Runs early in AppProviders so API calls do not race ahead of the bridge.
 */

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { ensureRestSession } from "@/lib/api/authClient.ts";

export function GoogleSessionBridge() {
  const { data: session, status } = useSession();
  const [bridgedForUserId, setBridgedForUserId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      setBridgedForUserId(null);
      return;
    }

    if (status !== "authenticated" || !session?.user?.id) {
      return;
    }

    if (bridgedForUserId === session.user.id) {
      return;
    }

    const userId = session.user.id;

    void ensureRestSession({ nextAuthUserId: userId }).then((user) => {
      if (user) {
        setBridgedForUserId(userId);
      }
    });
  }, [bridgedForUserId, session?.user?.id, status]);

  return null;
}
