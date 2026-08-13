/**
 * Cookie-forwarding GET for generateMetadata. Uses the public REST API so
 * pages never import models or services.
 */
import { cookies } from "next/headers";

import { AUTH_CONFIG } from "@/lib/auth/config.ts";

export async function fetchApiJson<T>(path: string): Promise<T | null> {
  const cookieHeader = (await cookies()).toString();
  const url = new URL(path, AUTH_CONFIG.APP_URL).toString();
  const response = await fetch(url, {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
    cache: "no-store",
  });
  if (!response.ok) return null;
  const body = (await response.json()) as { data?: T };
  return body.data ?? null;
}
