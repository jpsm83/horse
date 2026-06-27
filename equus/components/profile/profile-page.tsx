"use client";

/**
 * Auth-gated profile page — delegates to client content that shows skeleton until REST data loads.
 */

import { ProfilePageContent } from "@/components/profile/profile-page-content.tsx";

export function ProfilePage() {
  return <ProfilePageContent />;
}
