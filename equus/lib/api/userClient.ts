/**
 * Public user profile REST client — browser calls to `GET /api/v1/users/:id`.
 *
 * Auth is optional; uses silent auth failure so expired sessions on public pages
 * do not redirect to sign-in.
 */

import {
  ApiClientError,
  isApiClientError,
  runWithSilentAuthFailure,
} from "@/lib/api/authClient.ts";
import type { PublicUserProfileCard } from "@/lib/privacy/userPublicProfile.ts";

type ApiSuccess<T> = { data: T };
type ApiErrorBody = { error?: { code?: string; message?: string } };

export { isApiClientError };

async function parseApiResponse<T>(response: Response): Promise<T> {
  const body = (await response.json()) as ApiSuccess<T> | ApiErrorBody;

  if (!response.ok) {
    const message =
      "error" in body && body.error?.message ? body.error.message : "Request failed";
    const code =
      "error" in body && body.error?.code ? body.error.code : `HTTP_${response.status}`;
    throw new ApiClientError(response.status, message, code);
  }

  return (body as ApiSuccess<T>).data;
}

async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  let response = await fetch(input, { ...init, credentials: "include" });

  if (response.status === 401) {
    const refreshed = await fetch("/api/v1/auth/refresh", {
      method: "POST",
      credentials: "include",
    });
    if (refreshed.ok) {
      response = await fetch(input, { ...init, credentials: "include" });
    }
  }

  return response;
}

/** Load a visibility-filtered user card for entity-linked profile pages. */
export async function fetchPublicUserProfile(userId: string): Promise<PublicUserProfileCard> {
  return runWithSilentAuthFailure(async () => {
    const response = await apiFetch(`/api/v1/users/${encodeURIComponent(userId)}`);
    const data = await parseApiResponse<{ user: PublicUserProfileCard }>(response);
    return data.user;
  });
}

export type { PublicUserProfileCard };
