import type { AuthProvider, AuthUser } from "@/lib/auth/types.ts";
import type { PublicUser, UpdatePersonalDetailsInput } from "@/lib/services/userService.ts";
import type { UserOwnedNavigation } from "@/lib/services/navigationService.ts";
import type { PublicOwnershipTransfer } from "@/lib/services/ownershipTransferService.ts";
import type { PublicWorkplace } from "@/lib/services/workplaceRelationshipService.ts";

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

/** Auth routes where 401 means invalid credentials — do not attempt cookie refresh. */
const AUTH_NO_REFRESH_PATHS = [
  "/api/v1/auth/login",
  "/api/v1/auth/register",
  "/api/v1/auth/refresh",
  "/api/v1/auth/logout",
  "/api/v1/auth/session",
  "/api/v1/auth/me",
] as const;

function shouldAttemptTokenRefresh(url: string): boolean {
  return !AUTH_NO_REFRESH_PATHS.some((path) => url.startsWith(path));
}

let refreshInFlight: Promise<boolean> | null = null;
let silentAuthFailure = false;
let suppressSessionExpiredNotification = false;
let sessionExpiredHandler: (() => void) | null = null;
let lastSessionExpiredNotificationAt = 0;

/** Register a client handler for unrecoverable auth failure (e.g. redirect to sign-in). */
export function setSessionExpiredHandler(handler: (() => void) | null): void {
  sessionExpiredHandler = handler;
}

function notifySessionExpired(): void {
  if (suppressSessionExpiredNotification || !sessionExpiredHandler) {
    return;
  }

  const now = Date.now();
  if (now - lastSessionExpiredNotificationAt < 3_000) {
    return;
  }
  lastSessionExpiredNotificationAt = now;
  sessionExpiredHandler();
}

/** Suppress session-expired redirect/toast during intentional sign-out. */
export async function runWithSuppressedSessionExpired<T>(
  fn: () => Promise<T>,
): Promise<T> {
  const previous = suppressSessionExpiredNotification;
  suppressSessionExpiredNotification = true;
  try {
    return await fn();
  } finally {
    suppressSessionExpiredNotification = previous;
  }
}

/** Suppress session-expired redirect for optional auth probes on public pages. */
export async function runWithSilentAuthFailure<T>(fn: () => Promise<T>): Promise<T> {
  const previous = silentAuthFailure;
  silentAuthFailure = true;
  try {
    return await fn();
  } finally {
    silentAuthFailure = previous;
  }
}

/** Exchange refresh cookie for a new access token (deduped when multiple requests 401). */
async function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    try {
      const response = await fetch("/api/v1/auth/refresh", {
        method: "POST",
        credentials: "include",
      });
      return response.ok;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

const apiFetch = async (input: string, init?: RequestInit): Promise<Response> => {
  let response = await fetch(input, { ...init, credentials: "include" });

  if (response.status === 401 && shouldAttemptTokenRefresh(input)) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await fetch(input, { ...init, credentials: "include" });
    } else {
      resetOptionalUserCache();
      if (!silentAuthFailure) {
        notifySessionExpired();
      }
    }
  }

  return response;
};

/** In-memory cache so public pages (e.g. home) do not re-hit /auth/me on locale navigation. */
let optionalUserCache: AuthUser | null | undefined;
let navigationCache: UserOwnedNavigation | undefined;
const authStateListeners = new Set<() => void>();
let ensureRestSessionInFlight: Promise<AuthUser | null> | null = null;

/** Subscribe to REST session cache changes (login, logout, bridge). Used by `useAppAuth`. */
export function subscribeAuthStateChanged(listener: () => void): () => void {
  authStateListeners.add(listener);
  return () => {
    authStateListeners.delete(listener);
  };
}

function notifyAuthStateChanged(): void {
  for (const listener of authStateListeners) {
    listener();
  }
}

function isAuthenticatedCache(value: AuthUser | null | undefined): boolean {
  return value != null;
}

export function resetOptionalUserCache(): void {
  const wasAuthenticated = isAuthenticatedCache(optionalUserCache);
  optionalUserCache = undefined;
  navigationCache = undefined;
  if (wasAuthenticated) {
    notifyAuthStateChanged();
  }
}

function setOptionalUserCache(user: AuthUser | null): AuthUser | null {
  const wasAuthenticated = isAuthenticatedCache(optionalUserCache);
  const willBeAuthenticated = isAuthenticatedCache(user);
  const userIdChanged =
    optionalUserCache != null && user != null && optionalUserCache.id !== user.id;
  optionalUserCache = user;
  if (wasAuthenticated !== willBeAuthenticated || userIdChanged) {
    notifyAuthStateChanged();
  }
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

/** Send a password set/reset email for the signed-in user (session email only). */
export async function requestPasswordResetForCurrentUser(): Promise<{ message: string }> {
  const response = await apiFetch("/api/v1/users/me/request-password-reset", {
    method: "POST",
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

export async function acceptWorkplaceInvitation(invitationId: string): Promise<void> {
  await parseApiResponse(
    await apiFetch(`/api/v1/users/me/workplace-invitations/${invitationId}/accept`, {
      method: "POST",
    }),
  );
}

export async function declineWorkplaceInvitation(invitationId: string): Promise<void> {
  await parseApiResponse(
    await apiFetch(`/api/v1/users/me/workplace-invitations/${invitationId}/decline`, {
      method: "POST",
    }),
  );
}

/** @deprecated Use acceptWorkplaceInvitation */
export const acceptMembership = acceptWorkplaceInvitation;

/** @deprecated Use declineWorkplaceInvitation */
export const declineMembership = declineWorkplaceInvitation;

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

export type { PublicOwnershipTransfer };

export async function fetchPendingOwnershipTransfers(): Promise<PublicOwnershipTransfer[]> {
  const data = await parseApiResponse<{ transfers: PublicOwnershipTransfer[] }>(
    await apiFetch("/api/v1/users/me/ownership-transfers?status=pending"),
  );
  return data.transfers;
}

export async function acceptOwnershipTransfer(transferId: string): Promise<void> {
  await parseApiResponse(
    await apiFetch(`/api/v1/ownership-transfers/${transferId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "accepted" }),
    }),
  );
}

export async function declineOwnershipTransfer(transferId: string): Promise<void> {
  await parseApiResponse(
    await apiFetch(`/api/v1/ownership-transfers/${transferId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "declined" }),
    }),
  );
}

export type CreateOwnershipTransferClientInput = {
  entityType: "horse" | "stable" | "breeder" | "transport" | "ridingClub";
  entityId: string;
  transferKind: "transfer_main" | "remove_co_owner" | "promote_co_owner";
  receiverUserId?: string;
  targetCoOwnerUserId?: string;
  invitedEmail?: string;
  invitedName?: string;
};

export async function createOwnershipTransfer(
  input: CreateOwnershipTransferClientInput,
): Promise<PublicOwnershipTransfer> {
  const data = await parseApiResponse<{ transfer: PublicOwnershipTransfer }>(
    await apiFetch("/api/v1/ownership-transfers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
  return data.transfer;
}

export async function cancelOwnershipTransfer(transferId: string): Promise<void> {
  await parseApiResponse(
    await apiFetch(`/api/v1/ownership-transfers/${transferId}`, {
      method: "DELETE",
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

export async function fetchUserProfile(): Promise<{ user: PublicUser }> {
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

/** Deactivate the signed-in account (`DELETE /api/v1/users/me`). Clears REST session cookies server-side. */
export async function deactivateCurrentUserAccount(): Promise<{ user: PublicUser }> {
  const data = await parseApiResponse<{ user: PublicUser }>(
    await apiFetch("/api/v1/users/me", { method: "DELETE" }),
  );
  resetOptionalUserCache();
  return data;
}

/** Update profile fields; optional avatar upload uses multipart PATCH. */
export async function updateUserProfile(
  input: UpdatePersonalDetailsInput,
  imageFile?: File,
): Promise<{ user: PublicUser }> {
  let response: Response;

  if (imageFile) {
    const formData = new FormData();
    formData.append("imageUrl", imageFile);
    formData.append("profile", JSON.stringify(input));

    response = await apiFetch("/api/v1/users/me", {
      method: "PATCH",
      body: formData,
    });
  } else {
    response = await apiFetch("/api/v1/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  }

  const data = await parseApiResponse<{ user: PublicUser }>(response);
  resetOptionalUserCache();
  return data;
}

async function probeAuthMe(): Promise<AuthUser | null> {
  let response = await fetch("/api/v1/auth/me", { credentials: "include" });

  if (response.status === 401) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
    const message = "error" in body ? body.error?.message : undefined;

    // Anonymous visitor — no access cookie; skip refresh (avoids extra 401 noise).
    if (message === "No access token provided") {
      return null;
    }

    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await fetch("/api/v1/auth/me", { credentials: "include" });
    } else {
      return null;
    }
  }

  if (response.status === 401) {
    return null;
  }

  const data = await parseApiResponse<{ user: AuthUser }>(response);
  return data.user;
}

async function runEnsureRestSession(
  options: EnsureRestSessionOptions,
): Promise<AuthUser | null> {
  const { nextAuthUserId, required = false, attemptBridge = false } = options;

  const existing = await runWithSilentAuthFailure(() => probeAuthMe());
  if (existing) {
    return setOptionalUserCache(existing);
  }

  const shouldBridge = attemptBridge || Boolean(nextAuthUserId);
  if (shouldBridge) {
    const bridged = await bridgeFromNextAuth();
    if (bridged) {
      return bridged;
    }

    const afterBridge = await runWithSilentAuthFailure(() => probeAuthMe());
    if (afterBridge) {
      return setOptionalUserCache(afterBridge);
    }
  }

  setOptionalUserCache(null);

  if (required) {
    notifySessionExpired();
  }

  return null;
}

/** Bridge NextAuth (Google) to REST httpOnly cookies — internal; use `ensureRestSession`. */
async function bridgeFromNextAuth(): Promise<AuthUser | null> {
  const response = await fetch("/api/v1/auth/session", {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    return null;
  }

  const body = (await response.json()) as ApiSuccess<AuthSessionResult> | ApiErrorBody;
  if (!("data" in body) || !body.data?.user) {
    return null;
  }

  return setOptionalUserCache(body.data.user);
}

export type EnsureRestSessionOptions = {
  /** Present when NextAuth Google OAuth completed but REST cookies may be missing. */
  nextAuthUserId?: string;
  /** When true, notify session-expired handler if REST session cannot be established. */
  required?: boolean;
  /**
   * POST `/api/v1/auth/session` when REST cookies are missing.
   * Use on protected pages (e.g. after Google OAuth redirect) — server reads NextAuth cookie.
   */
  attemptBridge?: boolean;
};

/**
 * Ensure a valid REST session exists. Probes `/auth/me`, bridges from NextAuth only when needed.
 * Web auth truth is REST cookies — not NextAuth session alone.
 */
export async function ensureRestSession(
  options: EnsureRestSessionOptions = {},
): Promise<AuthUser | null> {
  const { nextAuthUserId, attemptBridge = false } = options;
  const bridgePending = attemptBridge || Boolean(nextAuthUserId);

  if (optionalUserCache !== undefined) {
    if (optionalUserCache !== null) {
      return optionalUserCache;
    }
    if (!bridgePending) {
      return null;
    }
  }

  if (ensureRestSessionInFlight) {
    return ensureRestSessionInFlight;
  }

  ensureRestSessionInFlight = runEnsureRestSession(options).finally(() => {
    ensureRestSessionInFlight = null;
  });

  return ensureRestSessionInFlight;
}

/** Optional auth probe for public pages — returns null when not signed in. */
export async function tryFetchCurrentUser(force = false): Promise<AuthUser | null> {
  if (!force && optionalUserCache !== undefined) {
    return optionalUserCache;
  }

  const user = await runWithSilentAuthFailure(() => probeAuthMe());
  return setOptionalUserCache(user);
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const user = await ensureRestSession({ attemptBridge: true, required: true });
  if (!user) {
    throw new ApiClientError(401, "Not authenticated", "UNAUTHORIZED");
  }
  return user;
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
