import { affiliateCompanies } from "@/lib/constants";

// Builds an affiliate URL for a given company, region, locale, and product
// region: IP-based location (determines Amazon domain - amazon.es, amazon.com, etc.)
// locale: User's language preference (determines search term language)
export function buildAffiliateUrl(
  affiliateCompany: keyof typeof affiliateCompanies, // The affiliate company key (e.g., "amazon")
  region: string, // The user's region code (e.g., "US", "BR", "ES", "FR", "DE", "IT", "UK", "CA", "AU", "IE", "NL")
  locale: string, // The user's locale/language preference (e.g., "en", "es", "pt", "fr", "de", "it")
  product?: string, // The product search term (optional)
  category?: string // The category name (optional, used when no product)
): string {
  const company = affiliateCompanies[affiliateCompany];

  // Map region codes (uppercase) to country keys (lowercase)
  // Handles various region code formats
  const regionToCountry: Record<string, keyof typeof company.country> = {
    US: "us",
    BR: "br",
    ES: "es",
    FR: "fr",
    DE: "de",
    IT: "it",
    UK: "uk",
    GB: "uk", // Great Britain also maps to UK
    CA: "ca",
    AU: "au",
    IE: "ie",
    NL: "nl",
  };

  const wordTranslations: Record<string, string> = {
    en: "woman",
    pt: "mulher",
    es: "mujer",
    it: "donna",
    fr: "femme",
    de: "Frau",
  };

  // Normalize region to uppercase for lookup
  const normalizedRegion = region.toUpperCase();

  // Get country code for domain selection (based on IP/region), default to "us" if region doesn't match
  const country =
    regionToCountry[normalizedRegion] || ("us" as keyof typeof company.country);

  // Extract language code from locale (e.g., "en" from "en-US" or "en")
  const languageCode = locale.split("-")[0]?.toLowerCase() || "en";

  let countryConfig = company.country[country];

  // CRITICAL: Ensure countryConfig exists and has both domain and affiliateId
  if (!countryConfig || !countryConfig.domain || !countryConfig.affiliateId) {
    console.warn(
      `⚠️ MISSING CONFIG: ${affiliateCompany} in region ${country}, Using US config as fallback for region ${country}`,
      {
        countryConfig,
        region,
        normalizedRegion,
      }
    );
    // Fallback to US config if missing
    const fallbackConfig = company.country.us;
    countryConfig = fallbackConfig;
  }

  // Determine search term: product > category > none
  // Use locale (user's language preference) for search term language, not country
  let searchTerm;
  if (product) {
    searchTerm = product;
  } else if (category) {
    const wordTranslation =
      wordTranslations[languageCode] || wordTranslations["en"];
    searchTerm = `${wordTranslation} ${category}`;
  }

  // Get the affiliate ID and domain - guaranteed to exist at this point
  const affiliateId = countryConfig.affiliateId;
  const domain = countryConfig.domain;

  // If we have a search term, build search URL
  if (searchTerm) {
    // Encode search term: replace spaces with + (Amazon format)
    // Then encode special characters, but keep + as + (not %2B)
    const encodedSearchTerm = encodeURIComponent(
      searchTerm.replace(/\s+/g, "+")
    ).replace(/%2B/g, "+");

    // Build URL: https://www.amazon.[domain]/s?k=[searchTerm]&tag=[affiliateId]
    const url = `${company.baseUrl}${domain}/s?k=${encodedSearchTerm}&tag=${affiliateId}`;

    // console.log("url", url);

    return url;
  }

  // If no search term, build homepage URL with just affiliate tag
  // Format: https://www.amazon.[domain]/s?k=[wordTranslations]&tag=[affiliateId]
  // Use locale (user's language preference) for search term language
  const wordTranslation =
    wordTranslations[languageCode] || wordTranslations["en"];
  const url = `${company.baseUrl}${domain}/s?k=${wordTranslation}&tag=${affiliateId}`;

  // console.log("url", url);

  return url;
}
