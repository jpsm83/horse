import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import {
  SITE_NAME,
  DOMAIN,
  DEFAULT_OG_IMAGE,
  languageMap,
  DEFAULT_OG_WIDTH,
  DEFAULT_OG_HEIGHT,
} from "./config.ts";
import {
  generateCanonicalUrl,
  generateLanguageAlternates,
} from "./canonical.ts";

type MetadataInput = {
  title: string;
  description: string;
  keywords?: string;
};

function buildRobotsDirective(index: boolean): string {
  if (!index) return "noindex, nofollow";
  return "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
}

async function loadMetadata(
  locale: string,
  titleKey: string
): Promise<MetadataInput> {
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t(`${titleKey}.title`),
    description: t(`${titleKey}.description`),
    keywords: t(`${titleKey}.keywords`),
  };
}

function buildMetadata(
  locale: string,
  route: string,
  meta: MetadataInput,
  image?: string,
  index: boolean = true
): Metadata {
  const canonicalUrl = generateCanonicalUrl(locale, route);
  const langCode = languageMap[locale] || locale;
  const ogImage = image || DEFAULT_OG_IMAGE;

  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    metadataBase: new URL(DOMAIN),
    robots: buildRobotsDirective(index),
    alternates: {
      canonical: canonicalUrl,
      languages: generateLanguageAlternates(route),
    },
    openGraph: {
      type: "website",
      locale: langCode,
      siteName: SITE_NAME,
      title: meta.title,
      description: meta.description,
      url: canonicalUrl,
      images: [
        {
          url: ogImage,
          width: DEFAULT_OG_WIDTH,
          height: DEFAULT_OG_HEIGHT,
          alt: meta.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: [ogImage],
    },
    other: {
      "theme-color": "#8B5CF6",
      "format-detection": "telephone=no",
    },
  };
}

export async function generatePublicMetadata(
  locale: string,
  route: string,
  titleKey: string,
  image?: string
): Promise<Metadata> {
  const meta = await loadMetadata(locale, titleKey);
  return buildMetadata(locale, route, meta, image, true);
}

export async function generatePrivateMetadata(
  locale: string,
  route: string,
  titleKey: string
): Promise<Metadata> {
  const meta = await loadMetadata(locale, titleKey);
  return buildMetadata(locale, route, meta, undefined, false);
}

export function generatePageNotFoundMetadata(): Metadata {
  return {
    title: "Page Not Found | Equus",
    description: "The page you are looking for does not exist or has been moved.",
    robots: "noindex, nofollow",
  };
}
