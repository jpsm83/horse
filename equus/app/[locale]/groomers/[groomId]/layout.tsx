/**
 * Groom layout — RSC that pre-fetches the role-aware groom view once per
 * navigation.
 *
 * Uses PreferHydrationBoundary so a guest RSC seed cannot overwrite a richer
 * owner cache. getServerUserId falls back to the refresh cookie for identity;
 * if identity is unresolved but a refresh cookie exists, seeding is skipped.
 */

import { QueryClient, dehydrate } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { PreferHydrationBoundary } from "@/components/shared/prefer-hydration-boundary.tsx";
import { GroomLayoutChrome } from "@/components/groom/groom-layout-chrome.tsx";
import { getServerUserId, hasRefreshCookie } from "@/lib/auth/serverSession.ts";
import { queryKeys } from "@/lib/api/queryKeys.ts";
import { getGroomView } from "@/lib/services/groomService.ts";
import connectDb from "@/lib/db.ts";

type GroomLayoutProps = {
  children: ReactNode;
  params: Promise<{ groomId: string; locale: string }>;
};

export default async function GroomLayout({ children, params }: GroomLayoutProps) {
  const { groomId } = await params;
  const queryClient = new QueryClient();

  try {
    await connectDb();
    const userId = await getServerUserId();
    const canRecoverSession = !userId && (await hasRefreshCookie());
    if (!canRecoverSession) {
      const data = await getGroomView(groomId, userId);
      queryClient.setQueryData(queryKeys.grooms.view(groomId), data);
    }
  } catch {
    // Non-fatal: the client will fetch on hydration if pre-fetch fails.
  }

  return (
    <PreferHydrationBoundary state={dehydrate(queryClient)}>
      <GroomLayoutChrome groomId={groomId}>{children}</GroomLayoutChrome>
    </PreferHydrationBoundary>
  );
}
