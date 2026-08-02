/**
 * TransportCreateClient — thin client boundary for the create-transport page
 * (`/transport/new`).
 */

"use client";

import { TransportCreateContent } from "@/components/transport/create/transport-create-content.tsx";

export function TransportCreateClient() {
  return <TransportCreateContent />;
}
