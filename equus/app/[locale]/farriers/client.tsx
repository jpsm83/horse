/**
 * FarrierListClient — thin client boundary for the farriers list page (`/farriers`).
 */

"use client";

import { FarrierListContent } from "@/components/farrier/list/farrier-list-content.tsx";

export function FarrierListClient() {
  return <FarrierListContent />;
}
