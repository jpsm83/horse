/**
 * Client-only profile page data loader — called from `ProfilePageContent` after mount.
 * REST auth requires browser cookies; do not run during SSR.
 */

import { fetchCurrentUser, fetchUserProfile } from "@/lib/api/authClient.ts";
import type { AuthUser } from "@/lib/auth/types.ts";
import type { PublicUser } from "@/lib/services/userService.ts";

export type ProfilePageData = {
  currentUser: AuthUser;
  profileResult: { user: PublicUser };
};

export function createProfilePageDataPromise(
  onUnauthenticated: () => void,
): Promise<ProfilePageData> {
  return fetchCurrentUser()
    .then((currentUser) =>
      fetchUserProfile().then((profileResult) => ({ currentUser, profileResult })),
    )
    .catch(() => {
      onUnauthenticated();
      return new Promise<never>(() => {});
    });
}
