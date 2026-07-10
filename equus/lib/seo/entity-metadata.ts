import type { Metadata } from "next";
import { generateCanonicalUrl } from "./canonical.ts";
import { DOMAIN, SITE_NAME } from "./config.ts";

interface EntityMetaInput {
  title: string;
  description: string;
  image?: string;
  canonicalPath: string;
  locale: string;
}

function buildEntityMetadata(input: EntityMetaInput): Metadata {
  const canonicalUrl = generateCanonicalUrl(input.locale, input.canonicalPath);
  const ogImage = input.image || "/og-image.png";
  return {
    title: `${input.title} | ${SITE_NAME}`,
    description: input.description,
    metadataBase: new URL(DOMAIN),
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: "website", siteName: SITE_NAME,
      title: `${input.title} | ${SITE_NAME}`,
      description: input.description, url: canonicalUrl,
      images: [{ url: ogImage, width: 1200, height: 630, alt: input.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${input.title} | ${SITE_NAME}`,
      description: input.description,
      images: [ogImage],
    },
  };
}

interface HorseData {
  name: string; breed?: string; age?: number | string;
  location?: string; description?: string; image?: string;
}

export function generateHorseMetadata(horse: HorseData, locale: string, horseId: string): Metadata {
  const location = horse.location ? ` \u2014 ${horse.location}` : "";
  const breed = horse.breed || "Horse";
  const age = horse.age ? `, ${horse.age} years old` : "";
  const description = horse.description || `${breed}${age}${location}`;
  return buildEntityMetadata({
    title: horse.name, description, image: horse.image,
    canonicalPath: `/horses/${horseId}`, locale,
  });
}

interface StableData {
  name: string; location?: string; description?: string; image?: string;
}

export function generateStableMetadata(stable: StableData, locale: string, stableId: string): Metadata {
  const location = stable.location ? ` \u2014 ${stable.location}` : "";
  const description = stable.description || `Stable${location}`;
  return buildEntityMetadata({
    title: stable.name, description, image: stable.image,
    canonicalPath: `/stables/${stableId}`, locale,
  });
}

type ProviderType = "breeders" | "transport" | "trainers" | "groomers" | "riders" | "coaches" | "farriers" | "veterinaries" | "riding-clubs";

interface ProviderData {
  name: string; businessName?: string; location?: string; description?: string; image?: string;
}

export function generateProviderMetadata(provider: ProviderData, type: ProviderType, locale: string, providerId: string): Metadata {
  const title = provider.businessName || provider.name;
  const description = provider.description || `Provider \u2014 ${type}`;
  return buildEntityMetadata({
    title, description, image: provider.image,
    canonicalPath: `/${type}/${providerId}`, locale,
  });
}

interface UserData { displayName: string; bio?: string; image?: string; }

export function generateUserMetadata(user: UserData, locale: string, userId: string): Metadata {
  const description = user.bio || "Equus member profile";
  return buildEntityMetadata({
    title: user.displayName || "User", description, image: user.image,
    canonicalPath: `/users/${userId}`, locale,
  });
}
