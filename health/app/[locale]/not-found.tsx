import { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { generatePublicMetadata } from "@/lib/utils/genericMetadata";
import { categoryHeroImages } from "@/lib/constants";
import ErrorBoundary from "@/components/ErrorBoundary";
import HeroSection from "@/components/server/HeroSection";
import ProductsBanner from "@/components/ProductsBanner";

export async function generateMetadata({
  params,
}: {
  params?: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = params ? (await params).locale : await getLocale();
  return generatePublicMetadata(locale, "/404", "metadata.notFound.title");
}

export default async function NotFound({
  params,
}: {
  params?: Promise<{ locale: string }>;
}) {
  const locale = params ? (await params).locale : await getLocale();
  const t = await getTranslations({ locale, namespace: "notFound" });

  return (
    <main>
      <ErrorBoundary context={"Not Found page"}>
        {/* Hero Section - Full width, positioned below navbar */}
        <HeroSection
          title={t("title")}
          description={t("description")}
          imageUrl={categoryHeroImages["search-no-results"]}
          alt={t("heroImageAlt")}
        />

        <div className="container mx-auto my-8 md:my-16">
          {/* Bottom banner - lazy loaded */}
          <ProductsBanner size="970x240" affiliateCompany="amazon" />
        </div>
      </ErrorBoundary>
    </main>
  );
}
