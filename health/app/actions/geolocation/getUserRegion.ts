"use server";

import { headers } from "next/headers";
import { unstable_cache } from "next/cache";
import { extractIP, isPrivateIP } from "@/lib/utils/ipDetection";

/**
 * Get user region from IP geolocation with caching and fallback services
 * Uses Vercel/Cloudflare headers first, then falls back to geolocation APIs
 * @returns Country code in ISO alpha-2 format (e.g., "ES", "US", "GB")
 */
export async function getUserRegion(): Promise<string> {
  try {
    const headersList = await headers();
    
    // Check Vercel/Cloudflare headers first (most reliable and free)
    const vercelCountry = headersList.get("x-vercel-ip-country");
    if (vercelCountry) return vercelCountry.toUpperCase();

    const cfCountry = headersList.get("cf-ipcountry");
    if (cfCountry) return cfCountry.toUpperCase();

    // Extract IP from headers
    const ip = extractIP(headersList);
    const isLocalhost = isPrivateIP(ip);

    // If no IP or localhost, use cached geolocation lookup
    if (!ip || isLocalhost) {
      return await getCachedRegion("auto");
    }

    // Use cached IP-based lookup (prevents rate limiting)
    return await getCachedRegion(ip);
  } catch (error) {
    console.error("Get region failed:", error instanceof Error ? error.message : error);
    return "US";
  }
}

/**
 * Cached IP geolocation lookup with fallback services
 * Prevents rate limiting by caching results per IP
 */
async function getCachedRegion(ip: string): Promise<string> {
  const cacheKey = `region-${ip}`;
  
  const getRegion = unstable_cache(
    async () => {
      // Try ipapi.co first
      try {
        const url = ip === "auto" 
          ? "https://ipapi.co/json/"
          : `https://ipapi.co/${ip}/json/`;

        const response = await fetch(url, {
          headers: { 
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json"
          },
        });

        // Handle rate limiting gracefully
        if (response.status === 429) {
          console.warn("ipapi.co rate limit reached, trying fallback service");
          return await tryFallbackService(ip);
        }

        if (!response.ok) {
          throw new Error(`ipapi.co returned status ${response.status}`);
        }

        const data = await response.json();
        
        if (data.error) {
          throw new Error(`ipapi.co error: ${data.reason || data.error}`);
        }

        if (data.country_code && typeof data.country_code === "string") {
          return data.country_code.toUpperCase();
        }
      } catch (error) {
        // If ipapi.co fails, try fallback service
        if (error instanceof Error && error.message.includes("429")) {
          return await tryFallbackService(ip);
        }
        console.error("ipapi.co failed:", error instanceof Error ? error.message : error);
        return await tryFallbackService(ip);
      }

      // Fallback to alternative service
      return await tryFallbackService(ip);
    },
    [cacheKey],
    {
      revalidate: 86400, // Cache for 24 hours (reduces API calls significantly)
      tags: [cacheKey],
    }
  );

  return await getRegion();
}

/**
 * Fallback geolocation service (ipinfo.io)
 * Free tier: 50,000 requests/month
 */
async function tryFallbackService(ip: string): Promise<string> {
  try {
    const url = ip === "auto"
      ? "https://ipinfo.io/json"
      : `https://ipinfo.io/${ip}/json`;

    const response = await fetch(url, {
      headers: { 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json"
      },
    });

    if (response.status === 429) {
      console.warn("ipinfo.io rate limit reached");
      return "US"; // Default fallback
    }

    if (!response.ok) {
      throw new Error(`ipinfo.io returned status ${response.status}`);
    }

    const data = await response.json();
    
    if (data.country && typeof data.country === "string") {
      return data.country.toUpperCase();
    }
  } catch (error) {
    console.error("Fallback geolocation service failed:", error instanceof Error ? error.message : error);
  }

  return "US"; // Default fallback
}

