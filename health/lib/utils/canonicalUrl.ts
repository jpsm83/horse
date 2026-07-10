import { getCategoryTranslation } from "@/lib/utils/routeTranslation";

// CRITICAL: Canonical URLs must always use production domain
// Even when running locally, canonical URLs point to production since we're working with production data
// This ensures canonical URLs in the database always use the correct production domain
const BASE_URL = process.env.CANONICAL_BASE_URL || "https://womensspot.org";

/**
 * Generates a canonical URL for an article
 * Format: [baseUrl]/[locale-if-not-en]/[translated-category]/[slug]
 * 
 * ⚠️ IMPORTANT: This function is ONLY used for:
 * 1. Fix script: Generating correct URLs when fixing invalid canonical URLs in the database
 * 2. Error messages: Showing expected format when validation fails
 * 3. Metadata fallback: Display purposes only (HTML metadata tags)
 * 
 * ❌ NOT used for: Generating canonical URLs for new articles
 *    - New articles get canonical URLs from n8n/OpenAI (hardcoded in the article data)
 *    - The API only VALIDATES canonical URLs, it does NOT generate them for new articles
 * 
 * @param category - English category name (e.g., "health", "nutrition")
 * @param slug - Article slug
 * @param locale - Language code (e.g., "en", "fr", "pt")
 * @returns Canonical URL string
 */
export function generateCanonicalUrl(
  category: string,
  slug: string,
  locale: string = "en"
): string {
  // Validate inputs
  if (!category || !slug) {
    throw new Error("Category and slug are required for canonical URL generation");
  }

  // Get translated category
  const translatedCategory = getCategoryTranslation(category, locale);

  // Build URL parts
  const parts: string[] = [BASE_URL];

  // Add locale only if not English
  if (locale !== "en") {
    parts.push(locale);
  }

  // Add translated category
  parts.push(translatedCategory);

  // Add slug
  parts.push(slug);

  return parts.join("/");
}

/**
 * Validates a canonical URL format
 * 
 * @param canonicalUrl - URL to validate
 * @param expectedCategory - Expected English category name
 * @param expectedSlug - Expected slug
 * @param expectedLocale - Expected locale
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateCanonicalUrl(
  canonicalUrl: string,
  expectedCategory: string,
  expectedSlug: string,
  expectedLocale: string = "en"
): { isValid: boolean; error?: string } {
  try {
    const url = new URL(canonicalUrl);
    
    // Check base URL
    const baseUrl = BASE_URL.replace(/^https?:\/\//, "");
    if (!url.hostname.includes(baseUrl.replace(/^www\./, ""))) {
      return {
        isValid: false,
        error: `Invalid base URL. Expected domain containing "${baseUrl}"`
      };
    }

    // Parse path
    const pathParts = url.pathname.split("/").filter(Boolean);
    
    // Determine expected path structure
    const expectedCategoryTranslation = getCategoryTranslation(expectedCategory, expectedLocale);
    const expectedPathParts: string[] = [];
    
    // Add locale only if not English
    if (expectedLocale !== "en") {
      expectedPathParts.push(expectedLocale);
    }
    
    expectedPathParts.push(expectedCategoryTranslation);
    expectedPathParts.push(expectedSlug);

    // Validate path structure
    if (pathParts.length !== expectedPathParts.length) {
      return {
        isValid: false,
        error: `Invalid path structure. Expected ${expectedPathParts.length} parts, got ${pathParts.length}`
      };
    }

    // Validate each part
    if (expectedLocale !== "en" && pathParts[0] !== expectedLocale) {
      return {
        isValid: false,
        error: `Invalid locale. Expected "${expectedLocale}", got "${pathParts[0]}"`
      };
    }

    const categoryIndex = expectedLocale === "en" ? 0 : 1;
    if (pathParts[categoryIndex] !== expectedCategoryTranslation) {
      return {
        isValid: false,
        error: `Invalid category. Expected "${expectedCategoryTranslation}", got "${pathParts[categoryIndex]}"`
      };
    }

    const slugIndex = expectedLocale === "en" ? 1 : 2;
    if (pathParts[slugIndex] !== expectedSlug) {
      return {
        isValid: false,
        error: `Invalid slug. Expected "${expectedSlug}", got "${pathParts[slugIndex]}"`
      };
    }

    // Check for "articles" or its translations (FORBIDDEN)
    const forbiddenWords = ["articles", "artigos", "articulos", "artikel", "articoli", "artikelen"];
    const pathString = pathParts.join("/").toLowerCase();
    for (const word of forbiddenWords) {
      if (pathString.includes(word)) {
        return {
          isValid: false,
          error: `FORBIDDEN: URL contains "${word}" instead of category. Must use category translation.`
        };
      }
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: `Invalid URL format: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Normalizes and fixes a canonical URL if invalid
 * 
 * ⚠️ IMPORTANT: This function is ONLY used for metadata display fallbacks.
 * It should NOT be used to save canonical URLs to the database.
 * Canonical URLs in the database come from n8n/OpenAI.
 * 
 * @param canonicalUrl - URL to normalize
 * @param category - English category name
 * @param slug - Article slug
 * @param locale - Language code
 * @returns Normalized canonical URL (for display/metadata purposes only)
 */
export function normalizeCanonicalUrl(
  canonicalUrl: string | undefined,
  category: string,
  slug: string,
  locale: string = "en"
): string {
  // If no canonical URL provided, generate one
  if (!canonicalUrl) {
    return generateCanonicalUrl(category, slug, locale);
  }

  // Validate the provided URL
  const validation = validateCanonicalUrl(canonicalUrl, category, slug, locale);
  
  // If valid, return as-is
  if (validation.isValid) {
    return canonicalUrl;
  }

  // If invalid, generate correct one and log warning
  console.warn(`Invalid canonical URL detected: ${canonicalUrl}`);
  console.warn(`Error: ${validation.error}`);
  console.warn(`Generating correct canonical URL: ${generateCanonicalUrl(category, slug, locale)}`);
  
  return generateCanonicalUrl(category, slug, locale);
}

