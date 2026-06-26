import { AUTH_CONFIG } from "./config.ts";
import { buildLocalizedAppLink } from "@/i18n/appLinks.ts";

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

export function buildConfirmEmailLink(rawToken: string, locale?: string): string {
  const token = rawToken.trim();
  if (!token) {
    throw new Error("Token is required");
  }
  return buildLocalizedAppLink(locale, AUTH_EMAIL_PATH_CONFIRM_EMAIL, { token });
}

export function buildResetPasswordLink(rawToken: string, locale?: string): string {
  const token = rawToken.trim();
  if (!token) {
    throw new Error("Token is required");
  }
  return buildLocalizedAppLink(locale, AUTH_EMAIL_PATH_RESET_PASSWORD, { token });
}
