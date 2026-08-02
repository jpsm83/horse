/**
 * WorkplacesClient — search-params hydration boundary for `/workplaces`.
 *
 * Reads the `membership` highlight param (deep link from signup) and passes it
 * to `WorkplacesContent`. This is the only component in the workplaces tree that
 * touches `useSearchParams()`, keeping `page.tsx` free of a Suspense boundary.
 */

"use client";

import { useSearchParams } from "next/navigation";

import { WorkplacesContent } from "@/components/invites/workplaces-content.tsx";

export function WorkplacesClient() {
  const searchParams = useSearchParams();
  return <WorkplacesContent membershipId={searchParams.get("membership")} />;
}
