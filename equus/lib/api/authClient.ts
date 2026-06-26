import type { AuthProvider, AuthUser } from "@/lib/auth/types.ts";

type ApiSuccess<T> = { data: T };
type ApiErrorBody = { error?: { code?: string; message?: string } };

export type AuthSessionResult = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

async function parseApiResponse<T>(response: Response): Promise<T> {
  const body = (await response.json()) as ApiSuccess<T> | ApiErrorBody;

  if (!response.ok) {
    const message =
      "error" in body && body.error?.message
        ? body.error.message
        : "Request failed";
    throw new Error(message);
  }

  return (body as ApiSuccess<T>).data;
}

const apiFetch = (input: string, init?: RequestInit) =>
  fetch(input, { ...init, credentials: "include" });

export async function loginWithCredentials(
  email: string,
  password: string,
): Promise<AuthSessionResult> {
  const response = await apiFetch("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  return parseApiResponse<AuthSessionResult>(response);
}

export async function registerWithCredentials(input: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  username?: string;
}): Promise<AuthSessionResult> {
  const response = await apiFetch("/api/v1/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return parseApiResponse<AuthSessionResult>(response);
}

/** Bridge NextAuth (Google) sign-in to REST API httpOnly cookies. */
export async function syncApiSession(): Promise<void> {
  const response = await apiFetch("/api/v1/auth/session", { method: "POST" });
  if (!response.ok) {
    throw new Error("Failed to sync session");
  }
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  let response = await apiFetch("/api/v1/auth/me");

  if (response.status === 401) {
    const refreshResponse = await apiFetch("/api/v1/auth/refresh", { method: "POST" });
    if (refreshResponse.ok) {
      response = await apiFetch("/api/v1/auth/me");
    }
  }

  const data = await parseApiResponse<{ user: AuthUser }>(response);
  return data.user;
}

export async function logoutFromApi(): Promise<void> {
  await apiFetch("/api/v1/auth/logout", { method: "POST" });
}

export function formatAuthProvider(provider?: AuthProvider | string): string {
  if (provider === "google") return "Google";
  if (provider === "credentials") return "Email & password";
  return provider ?? "Unknown";
}
