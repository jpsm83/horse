import { translateRouteToLocale } from "./routeTranslation";
import { headers } from "next/headers";

// Gets the base URL dynamically.
// Works in server actions, API routes, and services.
async function getBaseUrlForEmail(baseUrl?: string): Promise<string> {
  // If baseUrl is provided, use it (from API routes)
  if (baseUrl) {
    return baseUrl;
  }

  // Development: always use localhost
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  // Try to get from headers (works in server actions and API routes)
  try {
    const headersList = await headers();
    const host = headersList.get("host");
    const protocol = headersList.get("x-forwarded-proto") || "https";
    
    if (host) {
      return `${protocol}://${host}`;
    }
  } catch {
    // headers() not available in this context, continue to fallbacks
  }

  // Fallback: VERCEL_URL (automatically set by Vercel)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Fallback: NEXTAUTH_URL or BASE_URL (for email generation, these are acceptable)
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }

  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }

  // Last resort
  return "https://womensspot.org";
}

/**
 * Generates a properly localized and translated email link.
 * 
 * @param route - English route name (e.g., "reset-password")
 * @param params - Query parameters as key-value pairs
 * @param locale - User's preferred locale (defaults to "en")
 * @param baseUrl - Optional base URL. If not provided, will auto-detect from request headers or env vars
 * @returns Promise<string> - Full URL with locale and translated route
 */
export async function generateEmailLink(
  route: string, // English route name (e.g., "reset-password")
  params: Record<string, string>, // Query parameters as key-value pairs
  locale: string = "en", // User's preferred locale (defaults to "en")
  baseUrl?: string // Optional base URL (will auto-detect if not provided)
): Promise<string> {
  const resolvedBaseUrl = await getBaseUrlForEmail(baseUrl);
  
  // Translate the route name
  const translatedRoute = translateRouteToLocale(route, locale);
  
  // Build query string
  const queryString = new URLSearchParams(params).toString();
  
  // Construct full URL: /{locale}/{translated-route}?params
  return `${resolvedBaseUrl}/${locale}/${translatedRoute}${queryString ? `?${queryString}` : ""}`;
}

