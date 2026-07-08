import type { AuthProvider, AuthUser } from "@/lib/auth/types.ts";
import {
  ApiClientError,
  isApiClientError,
  parseApiResponse,
} from "@/lib/api/parseApiResponse";

export { ApiClientError };

type ApiSuccess<T> = { data: T };
type ApiErrorBody = { error?: { code?: string; message?: string } };

export type AuthSessionResult = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

/** Auth routes where 401 means invalid credentials — do not attempt cookie refresh. */
const AUTH_NO_REFRESH_PATHS = [
  "/api/v1/auth/login",
  "/api/v1/auth/register",
  "/api/v1/auth/refresh",
  "/api/v1/auth/logout",
  "/api/v1/auth/session",
  "/api/v1/auth/me",
] as const;

export function shouldAttemptTokenRefresh(url: string): boolean {
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

/** Notify the session-expired handler (throttled to once per 3s). Used by fetchWithAuth with notifyOnExpired. */
export function notifySessionExpired(): void {
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
export async function refreshAccessToken(): Promise<boolean> {
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

/** In-memory cache so public pages (e.g. home) do not re-hit /auth/me on locale navigation. */
let optionalUserCache: AuthUser | null | undefined;

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

export function resetOptionalUserCache(notify = true): void {
  const wasAuthenticated = isAuthenticatedCache(optionalUserCache);
  optionalUserCache = undefined;
  if (wasAuthenticated && notify) {
    notifyAuthStateChanged();
  }
}

export function setOptionalUserCache(user: AuthUser | null, notify = true): AuthUser | null {
  const wasAuthenticated = isAuthenticatedCache(optionalUserCache);
  const willBeAuthenticated = isAuthenticatedCache(user);
  const userIdChanged =
    optionalUserCache != null && user != null && optionalUserCache.id !== user.id;
  optionalUserCache = user;
  if ((wasAuthenticated !== willBeAuthenticated || userIdChanged) && notify) {
    notifyAuthStateChanged();
  }
  return user;
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

  return setOptionalUserCache(body.data.user, false);
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

async function runEnsureRestSession(
  options: EnsureRestSessionOptions,
): Promise<AuthUser | null> {
  const { nextAuthUserId, required = false, attemptBridge = false } = options;

  const existing = await runWithSilentAuthFailure(() => probeAuthMe());
  if (existing) {
    return setOptionalUserCache(existing, false);
  }

  const shouldBridge = attemptBridge || Boolean(nextAuthUserId);
  if (shouldBridge) {
    const bridged = await bridgeFromNextAuth();
    if (bridged) {
      return bridged;
    }

    const afterBridge = await runWithSilentAuthFailure(() => probeAuthMe());
    if (afterBridge) {
      return setOptionalUserCache(afterBridge, false);
    }
  }

  setOptionalUserCache(null, false);

  if (required) {
    notifySessionExpired();
  }

  return null;
}

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
  return setOptionalUserCache(user, false);
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const user = await ensureRestSession({ attemptBridge: true, required: true });
  if (!user) {
    throw new ApiClientError(401, "Not authenticated", "UNAUTHORIZED");
  }
  return user;
}

export async function logoutFromApi(): Promise<void> {
  await fetch("/api/v1/auth/logout", { method: "POST", credentials: "include" });
  setOptionalUserCache(null);
}

export function formatAuthProvider(provider?: AuthProvider | string): string {
  if (provider === "google") return "Google";
  if (provider === "credentials") return "Email & password";
  return provider ?? "Unknown";
}

export { isApiClientError };
