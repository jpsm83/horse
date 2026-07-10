"use client";

import { useRegion } from "@/contexts/RegionContext";
import { useLocale } from "next-intl";
import { buildAffiliateUrl } from "@/lib/utils/buildAffiliateUrl";
import { affiliateCompanies } from "@/lib/constants";

// Custom hook to build affiliate URLs using region and locale from context

export function useAffiliateUrl(
  affiliateCompany: keyof typeof affiliateCompanies, // The affiliate company key (e.g., "amazon")
  product?: string, // Optional product search term
  category?: string // Optional category name (used when no product)
): string {
  const { region } = useRegion();
  const locale = useLocale();

  return buildAffiliateUrl(affiliateCompany, region, locale, product, category);
}
