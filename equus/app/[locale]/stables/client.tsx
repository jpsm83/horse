/**
 * StableListClient — thin client boundary for the stables list page (`/stables`).
 */

"use client";

import { StableListContent } from "@/components/stable/list/stable-list-content.tsx";

export function StableListClient() {
  return <StableListContent />;
}
