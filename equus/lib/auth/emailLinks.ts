import { AUTH_CONFIG } from "./config.ts";

export const AUTH_EMAIL_PATH_CONFIRM_EMAIL = "confirm-email";
export const AUTH_EMAIL_PATH_RESET_PASSWORD = "reset-password";

export function normalizeAppBaseUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return null;
  }

  if (!url.hostname) {
    return null;
  }

  let pathname = url.pathname;
  if (pathname !== "/" && pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }

  if (pathname === "" || pathname === "/") {
    return url.origin;
  }

  return `${url.origin}${pathname}`;
}

export function resolveAppBaseUrl(): string {
  return normalizeAppBaseUrl(AUTH_CONFIG.APP_URL) ?? AUTH_CONFIG.APP_URL;
}

function buildAuthPageLink(pathSegment: string, rawToken: string): string {
  const token = rawToken.trim();
  if (!token) {
    throw new Error("Token is required");
  }

  const base = resolveAppBaseUrl();
  const baseForResolve = base.endsWith("/") ? base : `${base}/`;
  const query = new URLSearchParams({ token }).toString();
  return new URL(`${pathSegment}?${query}`, baseForResolve).href;
}

export function buildConfirmEmailLink(rawToken: string): string {
  return buildAuthPageLink(AUTH_EMAIL_PATH_CONFIRM_EMAIL, rawToken);
}

export function buildResetPasswordLink(rawToken: string): string {
  return buildAuthPageLink(AUTH_EMAIL_PATH_RESET_PASSWORD, rawToken);
}
