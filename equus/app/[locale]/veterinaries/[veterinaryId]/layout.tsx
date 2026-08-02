/**
 * Veterinary layout — RSC that pre-fetches the role-aware veterinary view once
 * per navigation.
 *
 * Uses PreferHydrationBoundary so a guest RSC seed cannot overwrite a richer
 * owner cache. getServerUserId falls back to the refresh cookie for identity;
 * if identity is unresolved but a refresh cookie exists, seeding is skipped.
 */

import { QueryClient, dehydrate } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { PreferHydrationBoundary } from "@/components/shared/prefer-hydration-boundary.tsx";
import { VeterinaryLayoutChrome } from "@/components/veterinary/veterinary-layout-chrome.tsx";
import { getServerUserId, hasRefreshCookie } from "@/lib/auth/serverSession.ts";
import { queryKeys } from "@/lib/api/queryKeys.ts";
import { getVeterinaryView } from "@/lib/services/veterinaryService.ts";
import connectDb from "@/lib/db.ts";

type VeterinaryLayoutProps = {
  children: ReactNode;
  params: Promise<{ veterinaryId: string; locale: string }>;
};

export default async function VeterinaryLayout({
  children,
  params,
}: VeterinaryLayoutProps) {
  const { veterinaryId } = await params;
  const queryClient = new QueryClient();

  try {
    await connectDb();
    const userId = await getServerUserId();
    const canRecoverSession = !userId && (await hasRefreshCookie());
    if (!canRecoverSession) {
      const data = await getVeterinaryView(veterinaryId, userId);
      queryClient.setQueryData(queryKeys.veterinaries.view(veterinaryId), data);
    }
  } catch {
    // Non-fatal: the client will fetch on hydration if pre-fetch fails.
  }

  return (
    <PreferHydrationBoundary state={dehydrate(queryClient)}>
      <VeterinaryLayoutChrome veterinaryId={veterinaryId}>{children}</VeterinaryLayoutChrome>
    </PreferHydrationBoundary>
  );
}
