/**
 * PedigreeConnectionsClient — search-params hydration boundary for
 * `/pedigree-connections`.
 *
 * Reads the `connection` highlight param (deep link from email) and passes it to
 * `PedigreeConnectionsContent`. This is the only component in the pedigree
 * connections tree that touches `useSearchParams()`, keeping `page.tsx` free of
 * a Suspense boundary.
 */

"use client";

import { useSearchParams } from "next/navigation";

import { PedigreeConnectionsContent } from "@/components/invites/pedigree-connections-content.tsx";

export function PedigreeConnectionsClient() {
  const searchParams = useSearchParams();
  return (
    <PedigreeConnectionsContent highlightConnectionId={searchParams.get("connection")} />
  );
}
