/**
 * Transport layout — RSC that pre-fetches the role-aware transport view once per
 * navigation.
 *
 * Uses PreferHydrationBoundary so a guest RSC seed cannot overwrite a richer
 * owner cache. getServerUserId falls back to the refresh cookie for identity;
 * if identity is unresolved but a refresh cookie exists, seeding is skipped.
 */

import { QueryClient, dehydrate } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { PreferHydrationBoundary } from "@/components/shared/prefer-hydration-boundary.tsx";
import { TransportLayoutChrome } from "@/components/transport/transport-layout-chrome.tsx";
import { getServerUserId, hasRefreshCookie } from "@/lib/auth/serverSession.ts";
import { queryKeys } from "@/lib/api/queryKeys.ts";
import { getTransportView } from "@/lib/services/transportService.ts";
import connectDb from "@/lib/db.ts";

type TransportLayoutProps = {
  children: ReactNode;
  params: Promise<{ transportId: string; locale: string }>;
};

export default async function TransportLayout({ children, params }: TransportLayoutProps) {
  const { transportId } = await params;
  const queryClient = new QueryClient();

  try {
    await connectDb();
    const userId = await getServerUserId();
    const canRecoverSession = !userId && (await hasRefreshCookie());
    if (!canRecoverSession) {
      const data = await getTransportView(transportId, userId);
      queryClient.setQueryData(queryKeys.transports.view(transportId), data);
    }
  } catch {
    // Non-fatal: the client will fetch on hydration if pre-fetch fails.
  }

  return (
    <PreferHydrationBoundary state={dehydrate(queryClient)}>
      <TransportLayoutChrome transportId={transportId}>{children}</TransportLayoutChrome>
    </PreferHydrationBoundary>
  );
}
