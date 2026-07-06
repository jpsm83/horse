/**
 * Shared fetch utility for TanStack Query hooks.
 * Handles cookie auth, token refresh, and consistent JSON parsing.
 * All client-side TanStack hooks call this instead of bare fetch().
 *
 * Token refresh delegates to authClient to share a single refreshInFlight.
 */

import { refreshAccessToken, shouldAttemptTokenRefresh } from "@/lib/api/authClient.ts";

type ApiSuccess<T> = { data: T };
type ApiErrorBody = { error?: { code?: string; message?: string; fields?: Record<string, string> } };

export class FetchError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly fields?: Record<string, string>;

  constructor(statusCode: number, message: string, code: string, fields?: Record<string, string>) {
    super(message);
    this.name = "FetchError";
    this.statusCode = statusCode;
    this.code = code;
    this.fields = fields;
  }
}

export function isFetchError(error: unknown): error is FetchError {
  return error instanceof FetchError;
}

export async function parseApiResponse<T>(response: Response): Promise<T> {
  const body = (await response.json()) as ApiSuccess<T> | ApiErrorBody;

  if (!response.ok) {
    const message = "error" in body && body.error?.message ? body.error.message : "Request failed";
    const code = "error" in body && body.error?.code ? body.error.code : `HTTP_${response.status}`;
    const fields = "error" in body ? body.error?.fields : undefined;
    throw new FetchError(response.status, message, code, fields);
  }

  return (body as ApiSuccess<T>).data;
}

export async function fetchWithAuth(input: string, init?: RequestInit): Promise<Response> {
  let response = await fetch(input, { ...init, credentials: "include" });

  if (response.status === 401 && shouldAttemptTokenRefresh(input)) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await fetch(input, { ...init, credentials: "include" });
    }
  }

  return response;
}
