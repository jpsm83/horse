/**
 * RiderCreateClient — thin client boundary for the create-rider page
 * (`/riders/new`).
 */

"use client";

import { RiderCreateContent } from "@/components/rider/create/rider-create-content.tsx";

export function RiderCreateClient() {
  return <RiderCreateContent />;
}
