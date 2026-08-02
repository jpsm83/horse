/**
 * Breeder layout — RSC that pre-fetches the role-aware breeder view once per
 * navigation.
 *
 * Uses PreferHydrationBoundary so a guest RSC seed cannot overwrite a richer
 * owner cache. getServerUserId falls back to the refresh cookie for identity;
 * if identity is unresolved but a refresh cookie exists, seeding is skipped.
 */

import { QueryClient, dehydrate } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { PreferHydrationBoundary } from "@/components/shared/prefer-hydration-boundary.tsx";
import { BreederLayoutChrome } from "@/components/breeder/breeder-layout-chrome.tsx";
import { getServerUserId, hasRefreshCookie } from "@/lib/auth/serverSession.ts";
import { queryKeys } from "@/lib/api/queryKeys.ts";
import { getBreederView } from "@/lib/services/breederService.ts";
import connectDb from "@/lib/db.ts";

type BreederLayoutProps = {
  children: ReactNode;
  params: Promise<{ breederId: string; locale: string }>;
};

export default async function BreederLayout({ children, params }: BreederLayoutProps) {
  const { breederId } = await params;
  const queryClient = new QueryClient();

  try {
    await connectDb();
    const userId = await getServerUserId();
    const canRecoverSession = !userId && (await hasRefreshCookie());
    if (!canRecoverSession) {
      const data = await getBreederView(breederId, userId);
      queryClient.setQueryData(queryKeys.breeders.view(breederId), data);
    }
  } catch {
    // Non-fatal: the client will fetch on hydration if pre-fetch fails.
  }

  return (
    <PreferHydrationBoundary state={dehydrate(queryClient)}>
      <BreederLayoutChrome breederId={breederId}>{children}</BreederLayoutChrome>
    </PreferHydrationBoundary>
  );
}
