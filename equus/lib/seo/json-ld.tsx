import { SITE_NAME, DOMAIN } from "./config.ts";

export function OrganizationJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: DOMAIN,
    logo: `${DOMAIN}/logo.png`,
    description: "Connect with horse owners, stables, breeders, and equestrian professionals.",
  };
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
  );
}

export function WebSiteJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME, url: DOMAIN,
    description: "Connect with horse owners, stables, breeders, and equestrian professionals.",
    publisher: { "@type": "Organization", name: SITE_NAME },
  };
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
  );
}

interface HorseJsonLdProps {
  name: string; description?: string; image?: string;
  breed?: string; gender?: string; birthDate?: string; url: string;
}

export function HorseJsonLd({ name, description, image, breed, gender, birthDate, url }: HorseJsonLdProps) {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org", "@type": "Product",
    name, description, image, url, category: "Horse",
  };
  if (breed) jsonLd.breed = breed;
  if (gender) jsonLd.gender = gender;
  if (birthDate) jsonLd.birthDate = birthDate;
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
  );
}

interface StableJsonLdProps {
  name: string; description?: string; image?: string;
  address?: Record<string, string>; telephone?: string; url: string;
}

export function StableJsonLd({ name, description, image, address, telephone, url }: StableJsonLdProps) {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org", "@type": "LocalBusiness",
    name, description, image, url,
  };
  if (address) jsonLd.address = { "@type": "PostalAddress", ...address };
  if (telephone) jsonLd.telephone = telephone;
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
  );
}

interface ProfessionalServiceJsonLdProps {
  name: string; description?: string; image?: string;
  address?: Record<string, string>; telephone?: string; url: string;
}

export function ProfessionalServiceJsonLd({ name, description, image, address, telephone, url }: ProfessionalServiceJsonLdProps) {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org", "@type": "ProfessionalService",
    name, description, image, url,
  };
  if (address) jsonLd.address = { "@type": "PostalAddress", ...address };
  if (telephone) jsonLd.telephone = telephone;
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
  );
}

interface PersonJsonLdProps { name: string; description?: string; image?: string; url: string; }

export function PersonJsonLd({ name, description, image, url }: PersonJsonLdProps) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
      "@context": "https://schema.org", "@type": "Person", name, description, image, url,
    }) }} />
  );
}

interface BreadcrumbItem { name: string; url: string; }

interface BreadcrumbListJsonLdProps { items: BreadcrumbItem[]; }

export function BreadcrumbListJsonLd({ items }: BreadcrumbListJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem", position: i + 1, name: item.name, item: item.url,
    })),
  };
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
  );
}
