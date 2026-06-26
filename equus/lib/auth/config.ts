function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function readRequiredSecret(name: string, devFallback: string): string {
  const value = readEnv(name);
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error(`${name} must be set in production`);
  }
  return devFallback;
}

function readAppUrl(): string {
  const value = readEnv("AUTH_URL") ?? readEnv("NEXTAUTH_URL");
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_URL must be set in production");
  }
  return "http://localhost:3000";
}

const appUrl = readAppUrl();

// NextAuth reads NEXTAUTH_URL directly; keep it in sync with AUTH_URL.
if (!readEnv("NEXTAUTH_URL")) {
  process.env.NEXTAUTH_URL = appUrl;
}

/**
 * Auth environment and constants.
 *
 * Required in `.env` (production):
 * - AUTH_SECRET   — signs access JWTs and NextAuth sessions
 * - REFRESH_SECRET — signs refresh JWTs
 * - AUTH_URL      — public app URL (e.g. http://localhost:3000)
 *
 * Optional:
 * - GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET — Google OAuth (web)
 */
export const AUTH_CONFIG = {
  SECRET: readRequiredSecret("AUTH_SECRET", "dev-auth-secret"),
  REFRESH_SECRET: readRequiredSecret("REFRESH_SECRET", "dev-refresh-secret"),
  APP_URL: appUrl,
  GOOGLE_CLIENT_ID: readEnv("GOOGLE_CLIENT_ID") ?? "",
  GOOGLE_CLIENT_SECRET: readEnv("GOOGLE_CLIENT_SECRET") ?? "",
  ACCESS_TOKEN_EXPIRES_IN: "15m",
  REFRESH_TOKEN_EXPIRES_IN: "7d",
  ACCESS_COOKIE_NAME: "access_token",
  REFRESH_COOKIE_NAME: "refresh_token",
  ACCESS_COOKIE_MAX_AGE_SECONDS: 60 * 15,
  COOKIE_MAX_AGE_SECONDS: 60 * 60 * 24 * 7,
} as const;
