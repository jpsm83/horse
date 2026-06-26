import type { AuthProvider, AuthUser } from "@/lib/auth/types.ts";
import type { UserOwnedNavigation } from "@/lib/services/navigationService.ts";
import type { PublicWorkplace } from "@/lib/services/roleMembershipService.ts";

type ApiSuccess<T> = { data: T };
type ApiErrorBody = { error?: { code?: string; message?: string } };

export type AuthSessionResult = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type PublicRelationship = {
  id: string;
  horseId: string;
  horseName?: string;
  relationshipType: string;
  status: string;
  requesterLabel?: string;
  invitedEmail?: string;
  referralReference?: string;
  requestedAt?: string;
};

export type InviteRefPreview = {
  kind: "staff" | "relationship";
  profileName?: string;
  horseName?: string;
  relationshipType?: string;
  requesterLabel?: string;
};

export class ApiClientError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(statusCode: number, message: string, code: string) {
    super(message);
    this.name = "ApiClientError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  const body = (await response.json()) as ApiSuccess<T> | ApiErrorBody;

  if (!response.ok) {
    const message =
      "error" in body && body.error?.message
        ? body.error.message
        : "Request failed";
    const code =
      "error" in body && body.error?.code
        ? body.error.code
        : `HTTP_${response.status}`;
    throw new ApiClientError(response.status, message, code);
  }

  return (body as ApiSuccess<T>).data;
}

const apiFetch = (input: string, init?: RequestInit) =>
  fetch(input, { ...init, credentials: "include" });

/** In-memory cache so public pages (e.g. home) do not re-hit /auth/me on locale navigation. */
let optionalUserCache: AuthUser | null | undefined;
let navigationCache: UserOwnedNavigation | undefined;

export function resetOptionalUserCache(): void {
  optionalUserCache = undefined;
  navigationCache = undefined;
}

function setOptionalUserCache(user: AuthUser | null): AuthUser | null {
  optionalUserCache = user;
  return user;
}

export async function loginWithCredentials(
  email: string,
  password: string,
): Promise<AuthSessionResult> {
  const response = await apiFetch("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const result = await parseApiResponse<AuthSessionResult>(response);
  setOptionalUserCache(result.user);
  return result;
}

export async function registerWithCredentials(input: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  referralReference?: string;
  preferredLanguage?: string;
}): Promise<AuthSessionResult> {
  const response = await apiFetch("/api/v1/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const result = await parseApiResponse<AuthSessionResult>(response);
  setOptionalUserCache(result.user);
  return result;
}

export async function confirmEmail(token: string): Promise<{ message: string }> {
  const response = await apiFetch("/api/v1/auth/confirm-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  return parseApiResponse<{ message: string }>(response);
}

export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  const response = await apiFetch("/api/v1/auth/request-password-reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  return parseApiResponse<{ message: string }>(response);
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<{ message: string }> {
  const response = await apiFetch("/api/v1/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  });

  return parseApiResponse<{ message: string }>(response);
}

export async function requestEmailConfirmation(email: string): Promise<{ message: string }> {
  const response = await apiFetch("/api/v1/auth/request-email-confirmation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  return parseApiResponse<{ message: string }>(response);
}

export async function fetchWorkplaces(): Promise<PublicWorkplace[]> {
  const data = await parseApiResponse<{ workplaces: PublicWorkplace[] }>(
    await apiFetch("/api/v1/users/me/workplaces"),
  );
  return data.workplaces;
}

export async function acceptMembership(membershipId: string): Promise<void> {
  await parseApiResponse(
    await apiFetch(`/api/v1/users/me/memberships/${membershipId}/accept`, {
      method: "POST",
    }),
  );
}

export async function declineMembership(membershipId: string): Promise<void> {
  await parseApiResponse(
    await apiFetch(`/api/v1/users/me/memberships/${membershipId}/decline`, {
      method: "POST",
    }),
  );
}

export async function fetchPendingRelationships(): Promise<PublicRelationship[]> {
  const data = await parseApiResponse<{ relationships: PublicRelationship[] }>(
    await apiFetch("/api/v1/users/me/relationships?status=pending"),
  );
  return data.relationships;
}

export async function acceptRelationship(relationshipId: string): Promise<void> {
  await parseApiResponse(
    await apiFetch(`/api/v1/relationships/${relationshipId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "accepted" }),
    }),
  );
}

export async function declineRelationship(relationshipId: string): Promise<void> {
  await parseApiResponse(
    await apiFetch(`/api/v1/relationships/${relationshipId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "declined" }),
    }),
  );
}

export async function resolveInviteRef(ref: string): Promise<InviteRefPreview | null> {
  const response = await apiFetch(
    `/api/v1/invites/preview?ref=${encodeURIComponent(ref)}`,
  );

  if (response.status === 404) {
    return null;
  }

  const data = await parseApiResponse<{ preview: InviteRefPreview }>(response);
  return data.preview;
}

export async function fetchUserProfile(): Promise<{
  user: { personalDetails: Record<string, unknown> };
}> {
  return parseApiResponse(await apiFetch("/api/v1/users/me"));
}

export async function fetchUserNavigation(force = false): Promise<UserOwnedNavigation> {
  if (!force && navigationCache !== undefined) {
    return navigationCache;
  }

  const data = await parseApiResponse<{ owned: UserOwnedNavigation }>(
    await apiFetch("/api/v1/users/me/navigation"),
  );
  navigationCache = data.owned;
  return data.owned;
}

export type { UserOwnedNavigation };

export async function updatePreferredLanguage(preferredLanguage: string): Promise<void> {
  await parseApiResponse(
    await apiFetch("/api/v1/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferredLanguage }),
    }),
  );
}

/** Bridge NextAuth (Google) sign-in to REST API httpOnly cookies. */
export async function syncApiSession(): Promise<void> {
  const response = await apiFetch("/api/v1/auth/session", { method: "POST" });
  if (!response.ok) {
    throw new Error("Failed to sync session");
  }
}

/** Optional auth probe for public pages — returns null when not signed in (no refresh retry). */
export async function tryFetchCurrentUser(force = false): Promise<AuthUser | null> {
  if (!force && optionalUserCache !== undefined) {
    return optionalUserCache;
  }

  const response = await apiFetch("/api/v1/auth/me");
  if (response.status === 401) {
    return setOptionalUserCache(null);
  }
  const data = await parseApiResponse<{ user: AuthUser }>(response);
  return setOptionalUserCache(data.user);
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
  setOptionalUserCache(data.user);
  return data.user;
}

export async function logoutFromApi(): Promise<void> {
  await apiFetch("/api/v1/auth/logout", { method: "POST" });
  setOptionalUserCache(null);
}

export function formatAuthProvider(provider?: AuthProvider | string): string {
  if (provider === "google") return "Google";
  if (provider === "credentials") return "Email & password";
  return provider ?? "Unknown";
}

export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}
