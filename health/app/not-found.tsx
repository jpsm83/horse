import { Metadata } from "next";
import { getTranslations, getMessages } from "next-intl/server";
import { headers } from "next/headers";
import { routing } from "@/i18n/routing";
import { NextIntlClientProvider } from "next-intl";
import { generatePublicMetadata } from "@/lib/utils/genericMetadata";
import { categoryHeroImages } from "@/lib/constants";
import { getUserRegion } from "@/app/actions/geolocation/getUserRegion";
import { RegionProvider } from "@/contexts/RegionContext";
import Navigation from "@/components/Navbar";
import Footer from "@/components/Footer";
import ErrorBoundary from "@/components/ErrorBoundary";
import HeroSection from "@/components/server/HeroSection";
import ProductsBanner from "@/components/ProductsBanner";

// Helper function to detect locale from URL pathname
async function detectLocale(): Promise<(typeof routing.locales)[number]> {
  const headersList = await headers();

  // Try to get pathname from headers (Next.js may set this)
  const pathname =
    headersList.get("x-pathname") ||
    headersList.get("x-invoke-path") ||
    headersList.get("referer")?.split("?")[0] ||
    "";

  // Extract locale from pathname if available
  if (pathname) {
    const urlPath = pathname.startsWith("http")
      ? new URL(pathname).pathname
      : pathname;

    const pathSegments = urlPath.split("/").filter(Boolean);
    const firstSegment = pathSegments[0];

    // Check if first segment is a valid locale
    if (
      firstSegment &&
      routing.locales.includes(firstSegment as (typeof routing.locales)[number])
    ) {
      return firstSegment as (typeof routing.locales)[number];
    }
  }

  // Fallback: try Accept-Language header
  const acceptLanguage = headersList.get("accept-language") || "";
  if (acceptLanguage) {
    const languages = acceptLanguage
      .split(",")
      .map((lang: string) => lang.split(";")[0].trim().substring(0, 2))
      .filter((lang: string) =>
        routing.locales.includes(lang as (typeof routing.locales)[number])
      );

    if (languages.length > 0) {
      return languages[0] as typeof routing.defaultLocale;
    }
  }

  return routing.defaultLocale;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  return generatePublicMetadata(locale, "/404", "metadata.notFound.title");
}

export default async function NotFound() {
  const locale = await detectLocale();
  const messages = await getMessages({ locale });
  const t = await getTranslations({ locale, namespace: "notFound" });

  // Get region for RegionProvider (required by ProductsBanner)
  const region = await getUserRegion();

  return (
    <NextIntlClientProvider messages={messages}>
      <RegionProvider initialRegion={region}>
        <main className="min-h-screen flex flex-col w-full max-w-full overflow-x-hidden">
          <Navigation />
          <div className="flex-1 flex flex-col pt-14 md:pt-16 w-full max-w-full overflow-x-hidden">
            <ErrorBoundary context={"Not Found page"}>
              {/* Hero Section - Full width, positioned below navbar */}
              <HeroSection
                title={t("title")}
                description={t("description")}
                imageUrl={categoryHeroImages["search-no-results"]}
                alt={t("heroImageAlt")}
              />
              
              <div className="container mx-auto my-8 md:my-16">
                <div className="flex flex-col h-full gap-8 md:gap-16">
                  {/* Products Banner */}
                  <ProductsBanner size="970x90" affiliateCompany="amazon" />

                  {/* Bottom banner - lazy loaded */}
                  <ProductsBanner size="970x240" affiliateCompany="amazon" />
                </div>
              </div>
            </ErrorBoundary>
          </div>
          <Footer />
        </main>
      </RegionProvider>
    </NextIntlClientProvider>
  );
}
