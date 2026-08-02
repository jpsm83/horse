/**
 * NotificationsClient — thin client boundary for `/notifications`.
 *
 * `/notifications` uses no search params, so this wrapper exists purely to keep
 * the route structure consistent with the rest of the app (thin `page.tsx` →
 * `client.tsx` → content component).
 */

"use client";

import { NotificationsContent } from "@/components/notifications/notifications-content.tsx";

export function NotificationsClient() {
  return <NotificationsContent />;
}
