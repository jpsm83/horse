import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

// Simple fallback metadata that doesn't require database access
export function generateSimpleFallbackMetadata(slug: string, locale: string, category?: string): Metadata {
  const baseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.VERCEL_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://womensspot.org';

  const canonicalUrl = `${baseUrl}/${locale}/${category || 'health'}/${slug}`;

  return {
    title: `${category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Health'} Article - Women's Spot`,
    description: `Discover valuable health insights and wellness tips on Women's Spot. Expert advice for women's health and wellness.`,
    keywords: 'health, women, wellness, fitness, nutrition, mental health, lifestyle',
    authors: [{ name: "Women's Spot Team" }],
    creator: "Women's Spot Team",
    publisher: "Women's Spot",
    metadataBase: new URL(baseUrl),
    robots: 'index, follow',
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `Women's Spot | ${category ? category : 'Health'} Article`,
      description: `Discover valuable health insights and wellness tips on Women's Spot.`,
      url: canonicalUrl,
      siteName: "Women's Spot",
      type: 'article',
      publishedTime: new Date().toISOString(),
      modifiedTime: new Date().toISOString(),
      authors: ["Women's Spot Team"],
      section: category || 'Health',
      tags: ['health', 'women', 'wellness', 'fitness', 'nutrition', 'mental health', 'lifestyle'],
      images: [
        {
          url: 'https://res.cloudinary.com/jpsm83/image/upload/v1760114436/health/xgy4rvnd9egnwzlvsfku.png',
          width: 1200,
          height: 630,
          alt: "Women's Spot - Empowering Women",
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@womensspot',
      creator: '@womensspot',
      title: `Women's Spot | ${category ? category : 'Health'} Article`,
      description: `Discover valuable health insights and wellness tips on Women's Spot.`,
      images: ['https://res.cloudinary.com/jpsm83/image/upload/v1760114436/health/xgy4rvnd9egnwzlvsfku.png'],
    },
  };
}

/*
 * GENERIC METADATA CONFIGURATION
 *
 * Provides clean, optimized metadata for all major social media platforms:
 *
 * ✅ Facebook, Instagram, LinkedIn, WhatsApp, Discord (Open Graph)
 * ✅ Twitter/X (Twitter Cards)
 * ✅ Pinterest (Rich Pins)
 * ✅ Threads (Meta's Twitter competitor)
 *
 * STRUCTURE:
 * - generateSimpleFallbackMetadata(): Simple fallback for basic pages
 * - generatePublicMetadata(): Full metadata for public pages
 * - generatePrivateMetadata(): Full metadata for private pages
 * - generatePageNotFoundMetadata(): 404 page metadata
 *
 * CUSTOMIZATION:
 * - Replace '@womensspot' with your actual social media handles
 * - Add verification codes when available
 * - Update theme colors if different from #8B5CF6
 */

// Language mapping for proper hreflang values
export const languageMap: Record<string, string> = {
  en: "en-US",
  pt: "pt-BR",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  it: "it-IT",
};

// Supported locales
export const supportedLocales = [
  "en",
  "pt",
  "es",
  "fr",
  "de",
  "it",
];

// Generate language alternates for a given route
export function generateLanguageAlternates(
  route: string
): Record<string, string> {
  const languageAlternates: Record<string, string> = {};

  supportedLocales.forEach((lang) => {
    const properLangCode = languageMap[lang] || lang;
    if (lang === 'en') {
      // Default locale is prefix-less
      languageAlternates[properLangCode] = route === '' ? '/' : `${route}`;
    } else {
      languageAlternates[properLangCode] = `/${lang}${route}`;
    }
  });

  return languageAlternates;
}

// Base metadata configuration
export const baseMetadata = {
  authors: [{ name: "Women's Spot Team" }],
  creator: "Women's Spot",
  publisher: "Women's Spot",
  siteName: "Women's Spot",
  images: [
    {
      url: "/womens-spot.png",
      width: 1024,
      height: 1024,
      alt: "Women's Spot - Empowering Women",
      type: "image/png",
    },
  ],
};

// Generate metadata for public pages (indexable)
export async function generatePublicMetadata(
  locale: string,
  route: string,
  titleKey: string,
  postImage?: string
): Promise<Metadata> {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://womensspot.org';

  // Load translations using next-intl
  const t = await getTranslations({ locale, namespace: "metadata" });

  // Extract page name from the key (e.g., 'metadata.home.title' -> 'home')
  const pageName = titleKey.split(".")[1] || "home";

  // Get translated content
  const title = t(`${pageName}.title`);
  const description = t(`${pageName}.description`);
  const keywords = t(`${pageName}.keywords`);

  // Determine proper language code
  const properLang = languageMap[locale] || locale;
  const languageAlternates = generateLanguageAlternates(route);
  const canonicalPath = locale === 'en' ? (route === '' ? '/' : `${route}`) : `/${locale}${route}`;
  const fullUrl = `${baseUrl}${canonicalPath}`;

  // Main image (use the same for all social networks)
  const imageUrl = postImage || baseMetadata.images[0].url;

  return {
    title,
    description,
    keywords,
    authors: [{ name: "Women's Spot Team" }],
    creator: "Women's Spot Team",
    publisher: "Women's Spot",
    metadataBase: new URL(baseUrl),
    robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    alternates: {
      canonical: canonicalPath,
      languages: languageAlternates,
    },

    // OPEN GRAPH — Used by Facebook, Pinterest, LinkedIn, WhatsApp
    openGraph: {
      title,
      description,
      url: fullUrl,
      siteName: "Women's Spot",
      locale: properLang,
      type: 'website',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },

    // TWITTER CARD — Used by Twitter/X
    twitter: {
      card: 'summary_large_image',
      site: '@womensspot',
      creator: '@womensspot',
      title,
      description,
      images: [imageUrl],
    },

    // OTHER METADATA — Includes Pinterest Rich Pins and SEO extensions
    other: {
      language: locale,
      // Pinterest Rich Pin support
      'pinterest:rich-pin': 'true',
      'pinterest:media': imageUrl,
      'pinterest:description': description,
      'pinterest:title': title,
      'pinterest:author': "Women's Spot Team",
      // Twitter Card validation metadata
      'twitter:card': 'summary_large_image',
      'twitter:site': '@womensspot',
      'twitter:creator': '@womensspot',
      'twitter:title': title,
      'twitter:description': description,
      'twitter:image': imageUrl,
      'twitter:image:alt': title,
      'whatsapp:description': description,
      // General SEO enhancements
      'theme-color': '#8B5CF6',
      'msapplication-TileColor': '#8B5CF6',
      'mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'default',
      'apple-mobile-web-app-title': 'Women\'s Spot',
      'application-name': 'Women\'s Spot',
      'format-detection': 'telephone=no',
      author: 'Women\'s Spot Team',
      copyright: `© ${new Date().getFullYear()} Women's Spot. All rights reserved.`,
      distribution: 'global',
      rating: 'general',
      'revisit-after': '7 days',
    },

    verification: {
      // You can add Google / Pinterest / Facebook verification tags here
    },
  };
}

// Generate metadata for private pages (noindex)
export async function generatePrivateMetadata(
  locale: string,
  route: string,
  titleKey: string,
  postImage?: string
): Promise<Metadata> {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://womensspot.org';

  // Load translations using next-intl
  const t = await getTranslations({ locale, namespace: "metadata" });

  // Extract page name from the key (e.g., 'metadata.home.title' -> 'home')
  const pageName = titleKey.split(".")[1] || "home";

  // Get translated content
  const title = t(`${pageName}.title`);
  const description = t(`${pageName}.description`);
  const keywords = t(`${pageName}.keywords`);

  // Determine proper language code
  const properLang = languageMap[locale] || locale;
  const languageAlternates = generateLanguageAlternates(route);
  const canonicalPath = locale === 'en' ? (route === '' ? '/' : `${route}`) : `/${locale}${route}`;
  const fullUrl = `${baseUrl}${canonicalPath}`;

  // Main image (use the same for all social networks)
  const imageUrl = postImage || baseMetadata.images[0].url;

  return {
    title,
    description,
    keywords,
    authors: [{ name: "Women's Spot Team" }],
    creator: "Women's Spot Team",
    publisher: "Women's Spot",
    metadataBase: new URL(baseUrl),
    robots: 'noindex, nofollow',
    alternates: {
      canonical: canonicalPath,
      languages: languageAlternates,
    },

    // OPEN GRAPH — Used by Facebook, Pinterest, LinkedIn, WhatsApp
    openGraph: {
      title,
      description,
      url: fullUrl,
      siteName: "Women's Spot",
      locale: properLang,
      type: 'website',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },

    // TWITTER CARD — Used by Twitter/X
    twitter: {
      card: 'summary_large_image',
      site: '@womensspot',
      creator: '@womensspot',
      title,
      description,
      images: [imageUrl],
    },

    // OTHER METADATA — Includes Pinterest Rich Pins and SEO extensions
    other: {
      language: locale,
      // Pinterest Rich Pin support
      'pinterest:rich-pin': 'true',
      'pinterest:media': imageUrl,
      'pinterest:description': description,
      'pinterest:title': title,
      'pinterest:author': "Women's Spot Team",
      // Twitter Card validation metadata
      'twitter:card': 'summary_large_image',
      'twitter:site': '@womensspot',
      'twitter:creator': '@womensspot',
      'twitter:title': title,
      'twitter:description': description,
      'twitter:image': imageUrl,
      'twitter:image:alt': title,
      'whatsapp:description': description,
      // General SEO enhancements
      'theme-color': '#8B5CF6',
      'msapplication-TileColor': '#8B5CF6',
      'mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'default',
      'apple-mobile-web-app-title': 'Women\'s Spot',
      'application-name': 'Women\'s Spot',
      'format-detection': 'telephone=no',
      author: 'Women\'s Spot Team',
      copyright: `© ${new Date().getFullYear()} Women's Spot. All rights reserved.`,
      distribution: 'global',
      rating: 'general',
      'revisit-after': '7 days',
    },

    verification: {
      // You can add Google / Pinterest / Facebook verification tags here
    },
  };
}

/**
 * Fallback metadata when page not found
 */
export function generatePageNotFoundMetadata(): Metadata {
  return {
    title: 'Page Not Found',
    description: 'The requested page could not be found.',
    robots: 'noindex, nofollow',
  };
}
