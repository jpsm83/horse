/**
 * RiderListClient — thin client boundary for the rider list page (`/riders`).
 */

"use client";

import { RiderListContent } from "@/components/rider/list/rider-list-content.tsx";

export function RiderListClient() {
  return <RiderListContent />;
}
