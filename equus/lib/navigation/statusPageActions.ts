/**
 * Status page action buttons — session-aware home/sign-in CTAs for 404, forbidden, errors.
 */

import type { StatusPageAction } from "@/components/status/status-page-shell.tsx";
import {
  GUEST_LANDING_PATH,
  USER_HOME_PATH,
} from "@/lib/navigation/postAuthRedirect.ts";

export type StatusPageActionLabels = {
  guestHome: string;
  userHome: string;
  signIn: string;
};

type BuildStatusPageActionsInput = {
  isAuthenticated: boolean;
  labels: StatusPageActionLabels;
};

/** Guest: go home (/) + sign in. Signed in: go home (/home) only. */
export function buildStatusPageActions({
  isAuthenticated,
  labels,
}: BuildStatusPageActionsInput): StatusPageAction[] {
  if (isAuthenticated) {
    return [{ label: labels.userHome, href: USER_HOME_PATH }];
  }

  return [
    { label: labels.guestHome, href: GUEST_LANDING_PATH },
    { label: labels.signIn, href: "/signin", variant: "outline" },
  ];
}
