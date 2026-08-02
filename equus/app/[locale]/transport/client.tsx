/**
 * TransportListClient — thin client boundary for the transport list page
 * (`/transport`).
 */

"use client";

import { TransportListContent } from "@/components/transport/list/transport-list-content.tsx";

export function TransportListClient() {
  return <TransportListContent />;
}
