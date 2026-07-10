import { Metadata } from "next";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { getTranslations } from "next-intl/server";

import { generatePublicMetadata } from "@/lib/utils/genericMetadata";
import { mainCategories, categoryHeroImages } from "@/lib/constants";
import ErrorBoundary from "@/components/ErrorBoundary";
import HeroSection from "@/components/server/HeroSection";
import FeatureCards from "@/components/server/FeatureCards";
import CategoryCards from "@/components/server/CategoryCards";
import FeaturedArticles from "@/components/FeaturedArticles";
import NewsletterSection from "@/components/server/NewsletterSection";
import CategoryCarouselSection from "@/components/server/CategoryCarouselSection";
import SectionHeader from "@/components/server/SectionHeader";
import { getArticles } from "@/app/actions/article/getArticles";
import { FeaturedArticlesSkeleton } from "@/components/skeletons/FeaturedArticlesSkeleton";
import { CategoryCarouselSkeleton } from "@/components/skeletons/CategoryCarouselSkeleton";
import SocialMedia from "@/components/SocialMedia";
import AdBanner from "@/components/adSence/AdBanner";

// Lazy load below-fold banners (they're not critical for initial render)
const ProductsBanner = dynamic(() => import("@/components/ProductsBanner"));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return generatePublicMetadata(locale, "", "metadata.home.title");
}

export const revalidate = 3600;

// Featured Articles Content Component
async function FeaturedArticlesContent({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home" });

  const featuredArticlesResponse = await getArticles({
    locale,
    limit: 9,
    skipCount: true,
    fields: "featured",
    random: true,
  });

  const articles = featuredArticlesResponse.data;

  if (!articles.length) {
    return (
      <div className="cv-auto px-3 py-8 text-center bg-white border rounded shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          {t("featuredArticles.title")}
        </h2>
        <p className="text-gray-500">{t("description")}</p>
      </div>
    );
  }

  return <FeaturedArticles articles={articles} />;
}

// Server Component - handles metadata generation
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });

  return (
    <main>
      <ErrorBoundary context={"Home component"}>
        {/* Hero Section - Full width, positioned below navbar */}
        <HeroSection
          title={t("title")}
          description={t("subtitle")}
          imageUrl={categoryHeroImages.home}
          alt={t("heroImageAlt")}
          buttonHref="#featured-articles"
          buttonText={t("buttonText")}
        />

        <div className="container mx-auto my-8 md:my-16">
          <div className="flex flex-col h-full gap-8 md:gap-16">
            {/* Products Banner */}
            <ProductsBanner size="970x90" affiliateCompany="amazon" />

            {/* AdBanner */}
            <AdBanner
              dataAdSlot="4003409246"
              uniqueId="adbanner-article-999"
              className="hidden lg:block"
            />

            {/* Feature Cards Section */}
            <FeatureCards locale={locale} />

            {/* AdBanner - On top of the home */}
            <div className="flex justify-center gap-6">
              <AdBanner dataAdSlot="5459821520" uniqueId="adbanner-home-1" />
              <AdBanner
                dataAdSlot="5459821520"
                uniqueId="adbanner-home-2"
                className="hidden md:block"
              />
              <AdBanner
                dataAdSlot="5459821520"
                uniqueId="adbanner-home-3"
                className="hidden md:block"
              />
              <AdBanner
                dataAdSlot="5459821520"
                uniqueId="adbanner-home-4"
                className="hidden lg:block"
              />
            </div>

            {/* Explore by Category */}
            <section className="space-y-6 md:space-y-12 bg-gray-100 py-3 md:py-6">
              <SectionHeader
                title={t("exploreByCategory.title")}
                description={t("exploreByCategory.description")}
              />
              <CategoryCards locale={locale} />
            </section>

            {/* AdBanner - On top of the home */}
            <div className="flex justify-center gap-6">
              <AdBanner dataAdSlot="5459821520" uniqueId="adbanner-home-5" />
              <AdBanner
                dataAdSlot="5459821520"
                uniqueId="adbanner-home-6"
                className="hidden md:block"
              />
              <AdBanner
                dataAdSlot="5459821520"
                uniqueId="adbanner-home-7"
                className="hidden md:block"
              />
              <AdBanner
                dataAdSlot="5459821520"
                uniqueId="adbanner-home-8"
                className="hidden lg:block"
              />
            </div>

            {/* Featured Articles Section */}
            <section id="featured-articles" className="space-y-6 md:space-y-12">
              <SectionHeader
                title={t("featuredArticles.title")}
                description={t("featuredArticles.description")}
              />
              <Suspense fallback={<FeaturedArticlesSkeleton />}>
                <FeaturedArticlesContent locale={locale} />
              </Suspense>
            </section>

            {/* AdBanner - On top of the home */}
            <div className="flex justify-center gap-6">
              <AdBanner dataAdSlot="5459821520" uniqueId="adbanner-home-9" />
              <AdBanner
                dataAdSlot="5459821520"
                uniqueId="adbanner-home-10"
                className="hidden md:block"
              />
              <AdBanner
                dataAdSlot="5459821520"
                uniqueId="adbanner-home-11"
                className="hidden md:block"
              />
              <AdBanner
                dataAdSlot="5459821520"
                uniqueId="adbanner-home-12"
                className="hidden lg:block"
              />
            </div>

            {/* Newsletter Section */}
            <NewsletterSection />

            {/* Products Banner */}
            <ProductsBanner size="970x90" affiliateCompany="amazon" />

            {/* Explore by Category Section */}
            <section className="space-y-6 md:space-y-12">
              {/* Social Media Section - After users see value */}
              <SocialMedia />

              {/* AdBanner - On top of the home */}
              <div className="flex justify-center gap-6">
                <AdBanner dataAdSlot="5459821520" uniqueId="adbanner-home-13" />
                <AdBanner
                  dataAdSlot="5459821520"
                  uniqueId="adbanner-home-14"
                  className="hidden md:block"
                />
                <AdBanner
                  dataAdSlot="5459821520"
                  uniqueId="adbanner-home-15"
                  className="hidden md:block"
                />
                <AdBanner
                  dataAdSlot="5459821520"
                  uniqueId="adbanner-home-16"
                  className="hidden lg:block"
                />
              </div>

              <div className="flex flex-col gap-3 md:gap-6">
                {mainCategories.map((category, index) => (
                  <Suspense
                    key={category}
                    fallback={<CategoryCarouselSkeleton />}
                  >
                    {index > 0 && (
                      <hr className="border-t border-gray-300 mt-4 md:mt-8" />
                    )}
                    <CategoryCarouselSection
                      category={category}
                      locale={locale}
                    />
                  </Suspense>
                ))}
              </div>
            </section>

            {/* Bottom banner - lazy loaded */}
            <ProductsBanner size="970x240" affiliateCompany="amazon" />

            {/* AdBanner - On top of the home */}
            <div className="flex justify-center gap-6">
              <AdBanner dataAdSlot="5459821520" uniqueId="adbanner-home-17" />
              <AdBanner
                dataAdSlot="5459821520"
                uniqueId="adbanner-home-18"
                className="hidden md:block"
              />
              <AdBanner
                dataAdSlot="5459821520"
                uniqueId="adbanner-home-19"
                className="hidden md:block"
              />
              <AdBanner
                dataAdSlot="5459821520"
                uniqueId="adbanner-home-20"
                className="hidden lg:block"
              />
            </div>
          </div>
        </div>
      </ErrorBoundary>
    </main>
  );
}
