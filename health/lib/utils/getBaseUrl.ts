import { headers } from "next/headers";

/**
 * Gets the base URL dynamically from request headers.
 * This is the recommended approach for Next.js 15 server actions.
 * 
 * Priority:
 * 1. Request headers (works in all environments)
 * 2. VERCEL_URL (automatically set by Vercel)
 * 3. BASE_URL (server-side env var, optional fallback)
 * 4. Development defaults to localhost
 */
export async function getBaseUrl(): Promise<string> {
  // Development: always use localhost
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  // Production: get from request headers (most reliable)
  try {
    const headersList = await headers();
    const host = headersList.get("host");
    const protocol = headersList.get("x-forwarded-proto") || "https";
    
    if (host) {
      return `${protocol}://${host}`;
    }
  } catch (error) {
    // headers() might fail in some edge cases, continue to fallbacks
    console.warn("[getBaseUrl] Could not read headers:", error);
  }

  // Fallback 1: VERCEL_URL (automatically set by Vercel)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Fallback 2: Server-side env var (not NEXT_PUBLIC_*)
  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }

  // Last resort: throw error with helpful message
  throw new Error(
    "Unable to determine base URL. " +
    "In production, this should be automatically detected from request headers. " +
    "If you're seeing this error, set BASE_URL environment variable as a fallback."
  );
}

/**
 * Gets the base URL from a NextRequest object (for API routes).
 * This extracts the base URL from the request URL.
 */
export function getBaseUrlFromRequest(req: Request): string {
  // Development: always use localhost
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  try {
    const url = new URL(req.url);
    return `${url.protocol}//${url.host}`;
  } catch (error) {
    console.warn("[getBaseUrlFromRequest] Could not parse request URL:", error);
  }

  // Fallback 1: VERCEL_URL (automatically set by Vercel)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Fallback 2: Server-side env var (not NEXT_PUBLIC_*)
  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }

  // Last resort: throw error with helpful message
  throw new Error(
    "Unable to determine base URL from request. " +
    "If you're seeing this error, set BASE_URL environment variable as a fallback."
  );
}

