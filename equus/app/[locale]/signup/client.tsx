/**
 * SignUpClient — search-params hydration boundary for `/signup`.
 *
 * Reads the `next` param (safe post-auth redirect) and the `ref` invite
 * reference, classifies it as a staff membership ref, and passes all three to
 * `SignUpContent`. This is the only component in the sign-up tree that touches
 * `useSearchParams()`, keeping `page.tsx` free of a Suspense boundary.
 */

"use client";

import { useSearchParams } from "next/navigation";

import { SignUpContent } from "@/components/auth/sign-up-content.tsx";
import { resolvePostAuthPath } from "@/lib/navigation/postAuthRedirect.ts";
import { isStaffMembershipRef } from "@/lib/utils/inviteRef.ts";

export function SignUpClient() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref")?.trim() ?? "";
  const isStaffRef = ref ? isStaffMembershipRef(ref) : false;
  return (
    <SignUpContent
      postAuthPath={resolvePostAuthPath(searchParams.get("next"))}
      ref={ref || undefined}
      isStaffRef={isStaffRef}
    />
  );
}
