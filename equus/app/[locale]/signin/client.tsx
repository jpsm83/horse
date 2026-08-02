/**
 * SignInClient — search-params hydration boundary for `/signin`.
 *
 * Reads the `next` param (safe post-auth redirect), parses it via
 * `resolvePostAuthPath`, and passes it to `SignInContent`. This is the only
 * component in the sign-in tree that touches `useSearchParams()`, which keeps
 * `page.tsx` free of a Suspense boundary.
 */

"use client";

import { useSearchParams } from "next/navigation";

import { SignInContent } from "@/components/auth/sign-in-content.tsx";
import { resolvePostAuthPath } from "@/lib/navigation/postAuthRedirect.ts";

export function SignInClient() {
  const searchParams = useSearchParams();
  const postAuthPath = resolvePostAuthPath(searchParams.get("next"));
  return <SignInContent postAuthPath={postAuthPath} />;
}
