/**
 * StableCreateClient — thin client boundary for the create-stable page
 * (`/stables/new`).
 */

"use client";

import { StableCreateContent } from "@/components/stable/create/stable-create-content.tsx";

export function StableCreateClient() {
  return <StableCreateContent />;
}
