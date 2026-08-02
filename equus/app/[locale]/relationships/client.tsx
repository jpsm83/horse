/**
 * RelationshipsClient — search-params hydration boundary for `/relationships`.
 *
 * Reads the `relationship` highlight param (deep link from email) and passes it
 * to `RelationshipsContent`. This is the only component in the relationships
 * tree that touches `useSearchParams()`, keeping `page.tsx` free of a Suspense
 * boundary.
 */

"use client";

import { useSearchParams } from "next/navigation";

import { RelationshipsContent } from "@/components/invites/relationships-content.tsx";

export function RelationshipsClient() {
  const searchParams = useSearchParams();
  return (
    <RelationshipsContent highlightRelationshipId={searchParams.get("relationship")} />
  );
}
