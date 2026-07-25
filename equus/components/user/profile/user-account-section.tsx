/**
 * UserAccountSection — account deactivation.
 *
 * Immediate action (not part of the deferred profile form).
 * Wraps ProfileDeactivateAccount in the Section component pattern.
 */

"use client";

import { ProfileDeactivateAccount } from "@/components/user/profile/profile-deactivate-account.tsx";

type Props = {
  onDeactivatingChange: (active: boolean) => void;
};

export function UserAccountSection({ onDeactivatingChange }: Props) {
  return <ProfileDeactivateAccount onDeactivatingChange={onDeactivatingChange} />;
}
