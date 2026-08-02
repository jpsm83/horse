/**
 * OwnershipTransfersClient — search-params hydration boundary for
 * `/ownership-transfers`.
 *
 * Reads the `transfer` highlight param (deep link from email) and passes it to
 * `OwnershipTransfersContent`. This is the only component in the ownership
 * transfers tree that touches `useSearchParams()`, keeping `page.tsx` free of a
 * Suspense boundary.
 */

"use client";

import { useSearchParams } from "next/navigation";

import { OwnershipTransfersContent } from "@/components/invites/ownership-transfers-content.tsx";

export function OwnershipTransfersClient() {
  const searchParams = useSearchParams();
  return (
    <OwnershipTransfersContent highlightTransferId={searchParams.get("transfer")} />
  );
}
