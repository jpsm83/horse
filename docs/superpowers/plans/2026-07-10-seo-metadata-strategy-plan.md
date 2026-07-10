# Equus SEO & Metadata Strategy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a comprehensive SEO/metadata strategy for Equus, porting and improving the Health project's approach.

**Architecture:** A `lib/seo/` directory with factory functions for generating Next.js Metadata objects, entity-specific metadata builders, JSON-LD structured data components, and canonical URL utilities. Integration via `generateMetadata` exports in layouts and pages, plus `app/sitemap.ts` and `app/robots.ts`.

**Tech Stack:** Next.js 16 (App Router), next-intl, TypeScript, schema.org (JSON-LD)

## Global Constraints

- All new SEO code in `lib/seo/` directory
- Metadata titles must follow pattern: `"Page Title | Equus"`
- OG type for all entity pages: `"website"`
- OG image default: `/og-image.png` (1200x630)
- All private/auth pages: `robots: "noindex, nofollow"`
- Follow `localePrefix: "as-needed"` (en = no prefix, es = `/es/...`)
- Metadata translations in new `metadata` namespace of `messages/{locale}.json`
- Keep existing `SetHtmlLang` for `<html lang>` attribute (no structural refactor needed)

---

### Task 1: Create `lib/seo/config.ts` — Site configuration constants

**Files:**
- Create: `lib/seo/config.ts`

**Produces:** `SITE_NAME`, `DOMAIN`, `DEFAULT_OG_IMAGE`, `languageMap`, `supportedLocales`, OG dimensions

- [ ] **Step 1: Write the file**

```typescript
export const SITE_NAME = "Equus";
export const DOMAIN =
  process.env.NEXTAUTH_URL || process.env.VERCEL_URL || "https://equus.app";

export const DEFAULT_OG_IMAGE = "/og-image.png";

export const languageMap: Record<string, string> = {
  en: "en-US",
  es: "es-ES",
};

export const supportedLocales = ["en", "es"];

export const DEFAULT_OG_WIDTH = 1200;
export const DEFAULT_OG_HEIGHT = 630;
```

- [ ] **Step 2: Commit**

```bash
git add lib/seo/config.ts
git commit -m "feat(seo): add site configuration constants"
```

---

### Task 2: Create `lib/seo/canonical.ts` — Canonical URL and hreflang utilities

**Files:**
- Create: `lib/seo/canonical.ts`

**Produces:** `generateCanonicalUrl(locale, path): string`, `generateLanguageAlternates(route): Record<string, string>`

- [ ] **Step 1: Write the file**

```typescript
import { DOMAIN, supportedLocales } from "./config.ts";

export function generateCanonicalUrl(locale: string, path: string): string {
  const base = DOMAIN.endsWith("/") ? DOMAIN.slice(0, -1) : DOMAIN;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const prefix = locale === "en" ? "" : `/${locale}`;
  return `${base}${prefix}${normalizedPath}`;
}

export function generateLanguageAlternates(
  route: string
): Record<string, string> {
  const alternates: Record<string, string> = {};
  const normalizedRoute = route.startsWith("/") ? route : `/${route}`;

  for (const locale of supportedLocales) {
    const langCode = locale === "en" ? "en-US" : "es-ES";
    const path = locale === "en" ? normalizedRoute : `/${locale}${normalizedRoute}`;
    alternates[langCode] = `${DOMAIN}${path}`;
  }

  return alternates;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/seo/canonical.ts
git commit -m "feat(seo): add canonical URL and hreflang utilities"
```

---

### Task 3: Create `lib/seo/metadata-factory.ts` — Core metadata generators

**Files:**
- Create: `lib/seo/metadata-factory.ts`

**Produces:** `generatePublicMetadata(locale, route, titleKey, image?)`, `generatePrivateMetadata(locale, route, titleKey)`, `generatePageNotFoundMetadata()`

- [ ] **Step 1: Write the file**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/seo/metadata-factory.ts
git commit -m "feat(seo): add core metadata factory (public/private/not-found)"
```

---

### Task 4: Add `metadata` namespace to `messages/en.json`

**Files:**
- Modify: `messages/en.json`

- [ ] **Step 1: Add metadata translations before closing brace of en.json**

New keys:

```json
  "metadata": {
    "home": {
      "title": "Equus — Horse & Equestrian Network",
      "description": "Connect with horse owners, stables, breeders, and equestrian professionals. Find horses, services, and build your equestrian network.",
      "keywords": "horses, equestrian, stables, breeders, horse network, equus"
    },
    "homeDashboard": {
      "title": "Home | Equus",
      "description": "Your Equus dashboard — manage horses, stables, and connections.",
      "keywords": ""
    },
    "horses": {
      "title": "Horses | Equus",
      "description": "Browse horses in the Equus network. Find horses by breed, discipline, and location.",
      "keywords": "horses for sale, horse listings, equestrian, horse breeds"
    },
    "stables": {
      "title": "Stables | Equus",
      "description": "Find stables and boarding facilities in the Equus network.",
      "keywords": "horse stables, boarding, equestrian facilities"
    },
    "breeders": {
      "title": "Breeders | Equus",
      "description": "Find horse breeders and breeding programs in the Equus network.",
      "keywords": "horse breeders, breeding, foals, equestrian"
    },
    "transport": {
      "title": "Horse Transport | Equus",
      "description": "Find horse transport services in the Equus network.",
      "keywords": "horse transport, equine shipping, horse trailers"
    },
    "trainers": {
      "title": "Horse Trainers | Equus",
      "description": "Find professional horse trainers in the Equus network.",
      "keywords": "horse trainers, equestrian training, dressage, jumping"
    },
    "groomers": {
      "title": "Horse Groomers | Equus",
      "description": "Find professional horse grooming services in the Equus network.",
      "keywords": "horse grooming, equine care, grooming services"
    },
    "riders": {
      "title": "Riders | Equus",
      "description": "Connect with riders in the Equus network.",
      "keywords": "equestrian riders, horseback riding, equestrian community"
    },
    "coaches": {
      "title": "Equestrian Coaches | Equus",
      "description": "Find equestrian coaches and instructors in the Equus network.",
      "keywords": "equestrian coach, riding instructor, horseback riding lessons"
    },
    "farriers": {
      "title": "Farriers | Equus",
      "description": "Find professional farriers and hoof care specialists in the Equus network.",
      "keywords": "farrier, hoof care, horse shoeing, equine hoof"
    },
    "veterinaries": {
      "title": "Equine Veterinarians | Equus",
      "description": "Find equine veterinarians and veterinary services in the Equus network.",
      "keywords": "equine vet, horse veterinarian, veterinary services"
    },
    "ridingClubs": {
      "title": "Riding Clubs | Equus",
      "description": "Find riding clubs and equestrian organizations in the Equus network.",
      "keywords": "riding club, equestrian club, horseback riding group"
    },
    "workplaces": {
      "title": "Workplaces | Equus",
      "description": "Manage your workplace connections in Equus.",
      "keywords": ""
    },
    "relationships": {
      "title": "Relationships | Equus",
      "description": "Manage your relationship requests and connections in Equus.",
      "keywords": ""
    },
    "ownershipTransfers": {
      "title": "Ownership Transfers | Equus",
      "description": "Manage horse ownership transfers in Equus.",
      "keywords": ""
    },
    "users": {
      "title": "User Profile | Equus",
      "description": "Equus member profile — connected through horses and services.",
      "keywords": ""
    },
    "signin": {
      "title": "Sign In | Equus",
      "description": "Sign in to your Equus account.",
      "keywords": ""
    },
    "signup": {
      "title": "Create an Account | Equus",
      "description": "Create your Equus account to connect with the equestrian community.",
      "keywords": ""
    },
    "forgotPassword": {
      "title": "Forgot Password | Equus",
      "description": "Reset your Equus account password.",
      "keywords": ""
    },
    "resetPassword": {
      "title": "Reset Password | Equus",
      "description": "Enter your new password for Equus.",
      "keywords": ""
    },
    "confirmEmail": {
      "title": "Confirm Email | Equus",
      "description": "Confirm your email address for Equus.",
      "keywords": ""
    },
    "resendConfirmation": {
      "title": "Resend Confirmation | Equus",
      "description": "Resend your email confirmation for Equus.",
      "keywords": ""
    },
    "profile": {
      "title": "Profile | Equus",
      "description": "Manage your Equus profile and preferences.",
      "keywords": ""
    },
    "notifications": {
      "title": "Notifications | Equus",
      "description": "Your Equus notifications.",
      "keywords": ""
    },
    "notFound": {
      "title": "Page Not Found | Equus",
      "description": "The page you are looking for does not exist or has been moved.",
      "keywords": "404, page not found, equus"
    },
    "notAllowed": {
      "title": "Access Denied | Equus",
      "description": "You do not have permission to access this page.",
      "keywords": ""
    }
  }
```

- [ ] **Step 2: Commit**

```bash
git add messages/en.json
git commit -m "feat(seo): add English metadata translations"
```

---

### Task 5: Add `metadata` namespace to `messages/es.json`

**Files:**
- Modify: `messages/es.json`

- [ ] **Step 1: Add Spanish metadata translations**

Same structure as en.json with Spanish values:

```json
  "metadata": {
    "home": {
      "title": "Equus — Red Ecuestre y de Caballos",
      "description": "Conecta con dueños de caballos, establos, criadores y profesionales ecuestres.",
      "keywords": "caballos, ecuestre, establos, criadores, red equina, equus"
    },
    "homeDashboard": { "title": "Inicio | Equus", "description": "Tu panel de Equus.", "keywords": "" },
    "horses": { "title": "Caballos | Equus", "description": "Explora caballos en la red Equus.", "keywords": "caballos en venta, listado de caballos" },
    "stables": { "title": "Establos | Equus", "description": "Encuentra establos en la red Equus.", "keywords": "establos para caballos" },
    "breeders": { "title": "Criadores | Equus", "description": "Encuentra criadores de caballos en la red Equus.", "keywords": "criadores de caballos, cría" },
    "transport": { "title": "Transporte Equino | Equus", "description": "Encuentra servicios de transporte de caballos.", "keywords": "transporte de caballos" },
    "trainers": { "title": "Entrenadores | Equus", "description": "Encuentra entrenadores profesionales de caballos.", "keywords": "entrenadores de caballos" },
    "groomers": { "title": "Peluqueros Equinos | Equus", "description": "Encuentra servicios de peluquería equina.", "keywords": "peluquería equina" },
    "riders": { "title": "Jinetes | Equus", "description": "Conecta con jinetes en la red Equus.", "keywords": "jinetes ecuestres" },
    "coaches": { "title": "Instructores | Equus", "description": "Encuentra instructores ecuestres.", "keywords": "instructor ecuestre" },
    "farriers": { "title": "Herradores | Equus", "description": "Encuentra herradores profesionales.", "keywords": "herrador, cuidado de cascos" },
    "veterinaries": { "title": "Veterinarios | Equus", "description": "Encuentra veterinarios equinos.", "keywords": "veterinario equino" },
    "ridingClubs": { "title": "Clubes de Equitación | Equus", "description": "Encuentra clubes de equitación.", "keywords": "club de equitación" },
    "workplaces": { "title": "Lugares de Trabajo | Equus", "description": "Gestiona tus conexiones laborales.", "keywords": "" },
    "relationships": { "title": "Relaciones | Equus", "description": "Gestiona tus solicitudes de relación.", "keywords": "" },
    "ownershipTransfers": { "title": "Transferencias | Equus", "description": "Gestiona transferencias de propiedad.", "keywords": "" },
    "users": { "title": "Perfil de Usuario | Equus", "description": "Perfil de miembro de Equus.", "keywords": "" },
    "signin": { "title": "Iniciar Sesión | Equus", "description": "Inicia sesión en tu cuenta de Equus.", "keywords": "" },
    "signup": { "title": "Crear una Cuenta | Equus", "description": "Crea tu cuenta de Equus.", "keywords": "" },
    "forgotPassword": { "title": "Olvidé mi Contraseña | Equus", "description": "Restablece tu contraseña.", "keywords": "" },
    "resetPassword": { "title": "Restablecer Contraseña | Equus", "description": "Ingresa tu nueva contraseña.", "keywords": "" },
    "confirmEmail": { "title": "Confirmar Correo | Equus", "description": "Confirma tu correo electrónico.", "keywords": "" },
    "resendConfirmation": { "title": "Reenviar Confirmación | Equus", "description": "Reenvía tu confirmación.", "keywords": "" },
    "profile": { "title": "Perfil | Equus", "description": "Gestiona tu perfil de Equus.", "keywords": "" },
    "notifications": { "title": "Notificaciones | Equus", "description": "Tus notificaciones de Equus.", "keywords": "" },
    "notFound": { "title": "Página No Encontrada | Equus", "description": "La página no existe o ha sido movida.", "keywords": "404, página no encontrada" },
    "notAllowed": { "title": "Acceso Denegado | Equus", "description": "No tienes permiso para acceder.", "keywords": "" }
  }
```

- [ ] **Step 2: Commit**

```bash
git add messages/es.json
git commit -m "feat(seo): add Spanish metadata translations"
```

---

### Task 6: Update `app/layout.tsx` — full root metadata + JSON-LD + viewport

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Rewrite root layout with full metadata**

```tsx
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/lib/seo/json-ld.tsx";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = process.env.NEXTAUTH_URL || "https://equus.app";

export const metadata: Metadata = {
  title: "Equus",
  description: "Equus horse management platform",
  metadataBase: new URL(BASE_URL),
  robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  openGraph: {
    type: "website",
    siteName: "Equus",
    title: "Equus — Horse & Equestrian Network",
    description: "Connect with horse owners, stables, breeders, and equestrian professionals.",
    url: BASE_URL,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Equus" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Equus — Horse & Equestrian Network",
    description: "Connect with horse owners, stables, breeders, and equestrian professionals.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  other: {
    "theme-color": "#8B5CF6",
    "msapplication-TileColor": "#8B5CF6",
    "format-detection": "telephone=no",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

type RootLayoutProps = { children: React.ReactNode };

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <OrganizationJsonLd />
        <WebSiteJsonLd />
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/layout.tsx
git commit -m "feat(seo): add full root metadata, viewport, and JSON-LD"
```

---

### Task 7: Create `lib/seo/json-ld.tsx` — JSON-LD structured data components

**Files:**
- Create: `lib/seo/json-ld.tsx`

- [ ] **Step 1: Write JSON-LD components**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/seo/json-ld.tsx
git commit -m "feat(seo): add JSON-LD structured data components"
```

---

### Task 8: Create `lib/seo/entity-metadata.ts` — Entity-specific metadata builders

**Files:**
- Create: `lib/seo/entity-metadata.ts`

- [ ] **Step 1: Write entity metadata builders**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/seo/entity-metadata.ts
git commit -m "feat(seo): add entity-specific metadata builders"
```

---

### Task 9: Update `app/[locale]/layout.tsx` — add generateMetadata

**Files:**
- Modify: `app/[locale]/layout.tsx`

- [ ] **Step 1: Add `generateMetadata` export to locale layout**

```tsx
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { AppShell } from "@/components/layout/app-shell.tsx";
import { AppProviders } from "@/components/providers/app-providers.tsx";
import { SetHtmlLang } from "@/components/set-html-lang.tsx";
import { routing } from "@/i18n/routing.ts";
import { generatePublicMetadata } from "@/lib/seo/metadata-factory.ts";

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePublicMetadata(locale, "", "metadata.home");
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) { notFound(); }
  setRequestLocale(locale);
  const messages = await getMessages();
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SetHtmlLang locale={locale} />
      <AppProviders>
        <AppShell>{children}</AppShell>
      </AppProviders>
    </NextIntlClientProvider>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/[locale]/layout.tsx"
git commit -m "feat(seo): add locale-scoped generateMetadata from translations"
```

---

### Task 10: Add metadata to all static public listing pages

**Files:**
- Modify: `app/[locale]/page.tsx`, `app/[locale]/home/page.tsx`
- Modify: `app/[locale]/horses/page.tsx`, `app/[locale]/stables/page.tsx`
- Modify: `app/[locale]/breeders/page.tsx`, `app/[locale]/transport/page.tsx`
- Modify: `app/[locale]/trainers/page.tsx`, `app/[locale]/groomers/page.tsx`
- Modify: `app/[locale]/riders/page.tsx`, `app/[locale]/coaches/page.tsx`
- Modify: `app/[locale]/farriers/page.tsx`, `app/[locale]/veterinaries/page.tsx`
- Modify: `app/[locale]/riding-clubs/page.tsx`
- Modify: `app/[locale]/workplaces/page.tsx`, `app/[locale]/relationships/page.tsx`
- Modify: `app/[locale]/ownership-transfers/page.tsx`

Each page adds a `generateMetadata` export. Example pattern for listing pages:

```typescript
import type { Metadata } from "next";
import { generatePublicMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePublicMetadata(locale, "/horses", "metadata.horses");
}
```

Route-to-key mapping for all pages:
- `/` (landing) → `"/"` → `"metadata.home"`
- `/home` → `"/home"` → `"metadata.homeDashboard"`
- `/horses` → `"/horses"` → `"metadata.horses"`
- `/stables` → `"/stables"` → `"metadata.stables"`
- `/breeders` → `"/breeders"` → `"metadata.breeders"`
- `/transport` → `"/transport"` → `"metadata.transport"`
- `/trainers` → `"/trainers"` → `"metadata.trainers"`
- `/groomers` → `"/groomers"` → `"metadata.groomers"`
- `/riders` → `"/riders"` → `"metadata.riders"`
- `/coaches` → `"/coaches"` → `"metadata.coaches"`
- `/farriers` → `"/farriers"` → `"metadata.farriers"`
- `/veterinaries` → `"/veterinaries"` → `"metadata.veterinaries"`
- `/riding-clubs` → `"/riding-clubs"` → `"metadata.ridingClubs"`
- `/workplaces` → `"/workplaces"` → `"metadata.workplaces"`
- `/relationships` → `"/relationships"` → `"metadata.relationships"`
- `/ownership-transfers` → `"/ownership-transfers"` → `"metadata.ownershipTransfers"`

- [ ] **Step 1: Commit all public page metadata**

```bash
git add app/[locale]/page.tsx app/[locale]/home/page.tsx app/[locale]/horses/page.tsx app/[locale]/stables/page.tsx app/[locale]/breeders/page.tsx app/[locale]/transport/page.tsx app/[locale]/trainers/page.tsx app/[locale]/groomers/page.tsx app/[locale]/riders/page.tsx app/[locale]/coaches/page.tsx app/[locale]/farriers/page.tsx app/[locale]/veterinaries/page.tsx app/[locale]/riding-clubs/page.tsx app/[locale]/workplaces/page.tsx app/[locale]/relationships/page.tsx app/[locale]/ownership-transfers/page.tsx
git commit -m "feat(seo): add metadata to all static public pages"
```

---

### Task 11: Add metadata to private/auth pages (noindex)

**Files:**
- Modify: `app/[locale]/signin/page.tsx`, `app/[locale]/signup/page.tsx`
- Modify: `app/[locale]/forgot-password/page.tsx`, `app/[locale]/reset-password/page.tsx`
- Modify: `app/[locale]/confirm-email/page.tsx`, `app/[locale]/resend-confirmation/page.tsx`
- Modify: `app/[locale]/profile/page.tsx`, `app/[locale]/notifications/page.tsx`
- Modify: `app/[locale]/not-allowed/page.tsx`
- Modify: `app/[locale]/horses/new/page.tsx`, `app/[locale]/stables/new/page.tsx`
- Modify: `app/[locale]/breeders/new/page.tsx`, `app/[locale]/transport/new/page.tsx`
- Modify: `app/[locale]/trainers/new/page.tsx`, `app/[locale]/groomers/new/page.tsx`
- Modify: `app/[locale]/riders/new/page.tsx`, `app/[locale]/coaches/new/page.tsx`
- Modify: `app/[locale]/farriers/new/page.tsx`, `app/[locale]/veterinaries/new/page.tsx`
- Modify: `app/[locale]/riding-clubs/new/page.tsx`

Example pattern for each private page:

```typescript
import type { Metadata } from "next";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/signin", "metadata.signin");
}
```

Route-to-key mapping:
- `/signin` → `"metadata.signin"`
- `/signup` → `"metadata.signup"`
- `/forgot-password` → `"metadata.forgotPassword"`
- `/reset-password` → `"metadata.resetPassword"`
- `/confirm-email` → `"metadata.confirmEmail"`
- `/resend-confirmation` → `"metadata.resendConfirmation"`
- `/profile` → `"metadata.profile"`
- `/notifications` → `"metadata.notifications"`
- `/not-allowed` → `"metadata.notAllowed"`
- All `/*/new/` pages → use same translation key as listing (e.g., `"metadata.horses"` for `/horses/new`)

- [ ] **Step 1: Commit all private page metadata**

```bash
git add app/[locale]/signin/page.tsx app/[locale]/signup/page.tsx app/[locale]/forgot-password/page.tsx app/[locale]/reset-password/page.tsx app/[locale]/confirm-email/page.tsx app/[locale]/resend-confirmation/page.tsx app/[locale]/profile/page.tsx app/[locale]/notifications/page.tsx app/[locale]/not-allowed/page.tsx app/[locale]/horses/new/page.tsx app/[locale]/stables/new/page.tsx app/[locale]/breeders/new/page.tsx app/[locale]/transport/new/page.tsx app/[locale]/trainers/new/page.tsx app/[locale]/groomers/new/page.tsx app/[locale]/riders/new/page.tsx app/[locale]/coaches/new/page.tsx app/[locale]/farriers/new/page.tsx app/[locale]/veterinaries/new/page.tsx app/[locale]/riding-clubs/new/page.tsx
git commit -m "feat(seo): add noindex metadata to private/auth pages"
```

---

### Task 12: Add dynamic entity metadata to entity detail pages

**Files:**
- Modify: `app/[locale]/horses/[horseId]/page.tsx`
- Modify: `app/[locale]/users/[userId]/page.tsx`

- [ ] **Step 1: Add generateHorseMetadata to horse detail page**

```typescript
import type { Metadata } from "next";
import { generateHorseMetadata } from "@/lib/seo/entity-metadata.ts";
import { getHorseById } from "@/lib/services/horse.ts"; // adjust import path

type PageProps = { params: Promise<{ horseId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { horseId, locale } = await params;
  try {
    const horse = await getHorseById(horseId);
    if (!horse) return { title: "Horse Not Found | Equus", robots: "noindex, nofollow" };
    return generateHorseMetadata(horse, locale, horseId);
  } catch {
    return { title: "Horse Not Found | Equus", robots: "noindex, nofollow" };
  }
}
```

- [ ] **Step 2: Add generateUserMetadata to user profile page**

```typescript
import type { Metadata } from "next";
import { generateUserMetadata } from "@/lib/seo/entity-metadata.ts";

type PageProps = { params: Promise<{ userId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { userId, locale } = await params;
  try {
    const user = await getUserById(userId);
    if (!user) return { title: "User Not Found | Equus", robots: "noindex, nofollow" };
    return generateUserMetadata(user, locale, userId);
  } catch {
    return { title: "User Not Found | Equus", robots: "noindex, nofollow" };
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add "app/[locale]/horses/[horseId]/page.tsx" "app/[locale]/users/[userId]/page.tsx"
git commit -m "feat(seo): add dynamic entity metadata to detail pages"
```

---

### Task 13: Create `app/robots.ts`

**Files:**
- Create: `app/robots.ts`

- [ ] **Step 1: Write robots.ts**

```typescript
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || "https://equus.app";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/", "/signin", "/signup", "/forgot-password",
          "/reset-password", "/confirm-email", "/resend-confirmation",
          "/profile", "/notifications", "/not-allowed",
          "/horses/new", "/stables/new",
          "/breeders/new", "/transport/new", "/trainers/new",
          "/groomers/new", "/riders/new", "/coaches/new",
          "/farriers/new", "/veterinaries/new", "/riding-clubs/new",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add app/robots.ts
git commit -m "feat(seo): add robots.txt generation"
```

---

### Task 14: Create `app/sitemap.ts`

**Files:**
- Create: `app/sitemap.ts`

- [ ] **Step 1: Write sitemap.ts**

```typescript
import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXTAUTH_URL || "https://equus.app";

const staticPublicRoutes = [
  { path: "", priority: 1.0 },
  { path: "/home", priority: 0.8 },
  { path: "/horses", priority: 0.8 },
  { path: "/stables", priority: 0.7 },
  { path: "/breeders", priority: 0.7 },
  { path: "/transport", priority: 0.7 },
  { path: "/trainers", priority: 0.7 },
  { path: "/groomers", priority: 0.7 },
  { path: "/riders", priority: 0.7 },
  { path: "/coaches", priority: 0.7 },
  { path: "/farriers", priority: 0.7 },
  { path: "/veterinaries", priority: 0.7 },
  { path: "/riding-clubs", priority: 0.7 },
  { path: "/workplaces", priority: 0.5 },
  { path: "/relationships", priority: 0.5 },
  { path: "/ownership-transfers", priority: 0.5 },
];

function buildUrl(route: string): string {
  return `${BASE_URL}${route}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  for (const route of staticPublicRoutes) {
    entries.push({
      url: buildUrl(route.path),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: route.priority,
    });
  }
  return entries;
}
```

Note: Entity detail URLs (horses, users) should be added when DB service layer is ready.

- [ ] **Step 2: Commit**

```bash
git add app/sitemap.ts
git commit -m "feat(seo): add dynamic sitemap generation"
```

---

### Task 15: Update catch-all page with not-found metadata

**Files:**
- Modify: `app/[locale]/[...rest]/page.tsx`

- [ ] **Step 1: Add not-found metadata to catch-all page**

```typescript
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Page Not Found | Equus",
  robots: "noindex, nofollow",
};

export default function CatchAllPage() {
  notFound();
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/[locale]/[...rest]/page.tsx"
git commit -m "feat(seo): add not-found metadata to catch-all route"
```

---

### Task 16: Legacy cleanup — remove `/me` redirect page

**Files:**
- Delete: `app/[locale]/me/page.tsx`

- [ ] **Step 1: Verify no internal references to `/me` route**

```bash
rg "'/me'" --type-add 'ts:*.{ts,tsx}' -t ts
```

Only `postAuthRedirect.ts` should reference it (already handled).

- [ ] **Step 2: Delete the file**

```bash
Remove-Item -LiteralPath "app/[locale]/me/page.tsx"
```

- [ ] **Step 3: Commit**

```bash
git add "app/[locale]/me/page.tsx"
git commit -m "chore: remove legacy /me redirect page"
```

---

### Task 17: Final verification

- [ ] **Step 1: Build the project**

```bash
npm run build
```

Expected: Successful build with no errors.

- [ ] **Step 2: Verify metadata output**

Run `npm run dev` and inspect the HTML of each page type:
- Landing page: `<title>`, `<meta name="description">`, `<meta property="og:...">`, `<meta name="twitter:...">`, `<link rel="canonical">`, `<link rel="alternate" hreflang="...">`, `<script type="application/ld+json">`
- Listing page (e.g., /horses): unique title
- Auth page (/signin): `noindex, nofollow`
- Entity detail (/horses/123): dynamic title
- Catch-all route: 404 metadata
- `/robots.txt`: correct disallow rules
- `/sitemap.xml`: correct URLs

- [ ] **Step 3: Fix any issues found**
