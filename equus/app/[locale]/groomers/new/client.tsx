/**
 * GroomCreateClient — thin client boundary for the groom create page
 * (`/groomers/new`).
 */

"use client";

import { GroomCreateContent } from "@/components/groom/create/groom-create-content.tsx";

export function GroomCreateClient() {
  return <GroomCreateContent />;
}
