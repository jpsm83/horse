# Equus SEO & Metadata Strategy — Design

**Date:** 2026-07-10
**Project:** Equus (Next.js 16, App Router, next-intl i18n)
**Reference:** Health project's SEO pattern (horse/health)

---

## Goal

Apply the same or better SEO/metadata strategy from the Health project to Equus, with enhancements for entity-specific structured data, dynamic metadata from database content, and proper i18n SEO foundations.

---

## Directory Structure

`
lib/seo/
+-- config.ts                  # Domain, site name, default OG image, locale map
+-- metadata-factory.ts        # generatePublicMetadata, generatePrivateMetadata, generateNotFoundMetadata, language alternates
+-- entity-metadata.ts         # Entity-specific builders (horse, stable, provider, user)
+-- json-ld.tsx                # JSON-LD React components per entity type
+-- canonical.ts               # Canonical URL builder
+-- schemas.ts                 # Schema.org type constants
`

---

## 1. Core Metadata Factory (lib/seo/config.ts + lib/seo/metadata-factory.ts)

Ported from Health's lib/utils/genericMetadata.ts with Equus-specific config.

### Config (config.ts)

- SITE_NAME = "Equus"
- DOMAIN = process.env.NEXTAUTH_URL \|\| "https://equus.app"
- DEFAULT_OG_IMAGE = "/og-image.png" (1200x630)
- languageMap: { en: "en-US", es: "es-ES" }
- supportedLocales = ["en", "es"]

### Factory Functions

**generatePublicMetadata(locale, route, titleKey, image?)** — For indexable pages:
1. Loads translations via getTranslations({ locale, namespace: "metadata" })
2. Extracts title, description, keywords from metadata.{titleKey}.*
3. Builds canonical URL via generateCanonicalUrl(locale, route)
4. Generates hreflang alternates via generateLanguageAlternates(route)
5. Returns complete Metadata object (title, description, keywords, authors, creator, publisher, metadataBase, robots, alternates, openGraph, twitter, other)

**generatePrivateMetadata(locale, route, titleKey)** — Same but with obots: "noindex, nofollow".

**generatePageNotFoundMetadata()** — Simple 404 metadata.

**generateLanguageAlternates(route)** — Returns Record<string, string> for all supportedLocales. English is prefix-less, es gets /es/... prefix.

---

## 2. Entity-Specific Metadata (lib/seo/entity-metadata.ts)

| Factory | Used for | OG/Twitter behavior |
|---------|----------|---------------------|
| generateHorseMetadata(horse, locale) | /horses/[horseId] | Title = horse name, desc = breed/age/location, OG = horse photo |
| generateStableMetadata(stable, locale) | /stables/[stableId] | Title = stable name, desc = location/services |
| generateProviderMetadata(provider, type, locale) | Provider details (all 9 types) | Title = provider + business name |
| generateUserMetadata(user, locale) | /users/[userId] | Title = user display name |

All use OG type "website". Canonical URLs follow: /{locale-path}/entity/{id}.

---

## 3. JSON-LD Structured Data (lib/seo/json-ld.tsx)

| Component | Schema.org Type | Placement |
|-----------|-----------------|-----------|
| OrganizationJsonLd | Organization | Root layout |
| WebSiteJsonLd | WebSite | Root layout |
| HorseJsonLd | Product | Horse detail |
| StableJsonLd | LocalBusiness | Stable detail |
| ProfessionalServiceJsonLd | ProfessionalService | Provider detail |
| PersonJsonLd | Person | User profile |
| BreadcrumbListJsonLd | BreadcrumbList | All detail pages |

---

## 4. Canonical URL (lib/seo/canonical.ts)

generateCanonicalUrl(locale, path) — Builds https://equus.app/{locale-if-not-en}{path}. Uses process.env.NEXTAUTH_URL \|\| "https://equus.app" as base. Respects localePrefix: "as-needed".

---

## 5. Sitemap (pp/sitemap.ts)

Dynamic XML sitemap. Entries for all static public pages + all entity detail pages (fetched from DB) in both en/es locales. Excludes auth pages, /new forms, /profile, /notifications, /not-allowed, /me, [...rest].

---

## 6. Robots (pp/robots.ts)

Disallow: /api/, auth pages, profile, notifications, /not-allowed, /*/new/. Allow: everything else. Sitemap: https://equus.app/sitemap.xml.

---

## 7. Page-by-Page Metadata Mapping

| Route | Metadata | JSON-LD |
|-------|----------|---------|
| / | Public | Organization + WebSite |
| /home | Public | — |
| /horses | Public | — |
| /horses/[horseId] | Horse entity | HorseJsonLd + Breadcrumb |
| /horses/new | Private (noindex) | — |
| /stables, /stables/new | Public / Private | — |
| All provider lists | Public | — |
| Provider details (future) | Provider entity | ProfessionalServiceJsonLd |
| /users/[userId] | User entity | PersonJsonLd |
| Auth pages | Private (noindex) | — |
| /profile, /notifications | Private (noindex) | — |
| /workplaces, /relationships, /ownership-transfers | Public | — |
| /not-allowed | Private (noindex) | — |
| [...rest] | 404 metadata | — |

---

## 8. Translation Integration

New metadata namespace in messages/{locale}.json with keys for every page: home, horses, stables, reeders, 	ransport, 	rainers, groomers, iders, coaches, arriers, eterinaries, idingClubs, workplaces, elationships, ownershipTransfers, users, signin, signup, orgotPassword, esetPassword, confirmEmail, esendConfirmation, profile, 
otifications, 
otAllowed, 
otFound.

Each key: { title, description, keywords }.

---

## 9. Layout Changes

**pp/layout.tsx**: Add metadataBase, icons, manifest, viewport, OG/Twitter base, robots, OrganizationJsonLd + WebSiteJsonLd scripts.

**pp/[locale]/layout.tsx**: Add generateMetadata calling generatePublicMetadata(locale, "", "metadata.home"). Remove SetHtmlLang — set <html lang> server-side.

---

## 10. OG/Twitter Image Strategy

- Static pages: default /og-image.png (1200x630)
- Entity detail: entity's primary image, fallback to default
- Twitter: summary_large_image card

---

## 11. Legacy Cleanup

- Remove /me page (pp/[locale]/me/page.tsx)
- Remove SetHtmlLang component (components/set-html-lang.tsx)
- Verify no other dead SEO/metadata code remains

---

## 12. Implementation Order

1. Create lib/seo/ with config, metadata-factory, canonical utilities
2. Add metadata translations to messages/en.json and messages/es.json
3. Update pp/layout.tsx with full metadata + JSON-LD
4. Update pp/[locale]/layout.tsx with generateMetadata + remove SetHtmlLang
5. Add metadata exports to all static pages
6. Create entity metadata factories + JSON-LD components
7. Add entity metadata to entity detail pages
8. Create pp/robots.ts
9. Create pp/sitemap.ts
10. Legacy cleanup
11. Verify all pages have unique <title> + social previews
