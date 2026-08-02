/**
 * FarrierCreateClient — thin client boundary for the farrier create page
 * (`/farriers/new`).
 */

"use client";

import { FarrierCreateContent } from "@/components/farrier/create/farrier-create-content.tsx";

export function FarrierCreateClient() {
  return <FarrierCreateContent />;
}
