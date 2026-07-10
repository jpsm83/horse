import { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProductsBanner from "@/components/ProductsBanner";
import HeroSection from "@/components/server/HeroSection";
import FeaturedArticles from "@/components/FeaturedArticles";
import PaginationSection from "@/components/server/PaginationSection";
import { searchArticlesPaginated } from "@/app/actions/article/searchArticlesPaginated";
import { ArticlesWithPaginationSkeleton } from "@/components/skeletons/ArticlesWithPaginationSkeleton";
import { generatePublicMetadata } from "@/lib/utils/genericMetadata";
import { categoryHeroImages } from "@/lib/constants";
import NewsletterSignup from "@/components/NewsletterSignup";
import HeroCountUpdater from "@/components/HeroCountUpdater";
import { HeroDescriptionProvider } from "@/components/HeroDescriptionContext";
import AdBanner from "@/components/adSence/AdBanner";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { q } = await searchParams;
  const query = q as string;

  // Use generatePublicMetadata helper
  const metadata = await generatePublicMetadata(
    locale,
    "/search",
    "metadata.search.title"
  );

  // Enhance with query if present
  if (query) {
    return {
      ...metadata,
      title: `Search results for "${query}" | ${metadata.title}`,
      description: `Find articles related to "${query}"`,
    };
  }

  return metadata;
}

export const revalidate = 3600; // Public page, cache for 1 hour

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  const { q } = await searchParams;
  const query = q as string;

  // Redirect to home if no search query
  if (!query || query.trim() === "") {
    redirect(`/${locale}`);
  }

  const t = await getTranslations({ locale, namespace: "search" });

  // Render immediately - no blocking data fetch
  // Static components render right away, Suspense handles data loading

  const initialDescription = t("resultsFound", {
    count: 0,
    query: query,
  });

  return (
    <main>
      <ErrorBoundary context={"Search page"}>
        <HeroDescriptionProvider initialDescription={initialDescription}>
          {/* Hero Section - Full width, positioned below navbar */}
          <HeroSection
            title={t("resultsTitle")}
            description={initialDescription}
            imageUrl={categoryHeroImages["search-results"]}
            alt={t("heroImageAlt")}
          />

          <div className="container mx-auto my-8 md:my-16">
            <div className="flex flex-col h-full gap-8 md:gap-16">
              {/* Products Banner - renders immediately */}
              <ProductsBanner size="970x90" affiliateCompany="amazon" />

              {/* AdBanner */}
              <div className="flex justify-center gap-6">
                <AdBanner
                  dataAdSlot="5459821520"
                  uniqueId="adbanner-search-1"
                />
                <AdBanner
                  dataAdSlot="5459821520"
                  uniqueId="adbanner-search-2"
                  className="hidden md:block"
                />
                <AdBanner
                  dataAdSlot="5459821520"
                  uniqueId="adbanner-search-3"
                  className="hidden md:block"
                />
                <AdBanner
                  dataAdSlot="5459821520"
                  uniqueId="adbanner-search-4"
                  className="hidden lg:block"
                />
              </div>

              {/* Search Results Section - Suspense shows skeleton while loading */}
              <Suspense fallback={<ArticlesWithPaginationSkeleton />}>
                <SearchResultsContent
                  query={query}
                  locale={locale}
                  searchParams={searchParams}
                />
              </Suspense>

              {/* AdBanner */}
              <AdBanner
                dataAdSlot="4003409246"
                uniqueId="adbanner-search-5"
                className="hidden lg:block"
              />

              {/* Newsletter Signup Section - renders immediately */}
              <NewsletterSignup />

              {/* Products Banner - renders immediately */}
              <ProductsBanner size="970x240" affiliateCompany="amazon" />

              {/* AdBanner */}
              <div className="flex justify-center gap-6">
                <AdBanner
                  dataAdSlot="5459821520"
                  uniqueId="adbanner-search-6"
                />
                <AdBanner
                  dataAdSlot="5459821520"
                  uniqueId="adbanner-search-7"
                  className="hidden md:block"
                />
                <AdBanner
                  dataAdSlot="5459821520"
                  uniqueId="adbanner-search-8"
                  className="hidden md:block"
                />
                <AdBanner
                  dataAdSlot="5459821520"
                  uniqueId="adbanner-search-9"
                  className="hidden lg:block"
                />
              </div>
            </div>
          </div>
        </HeroDescriptionProvider>
      </ErrorBoundary>
    </main>
  );
}

// Search Results Content Component - handles ALL data fetching
async function SearchResultsContent({
  query,
  locale,
  searchParams,
}: {
  query: string;
  locale: string;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const ARTICLES_PER_PAGE = 10;
  const resolvedParams = await searchParams;
  const pageParam = resolvedParams.page || "1";
  const currentPage = Math.max(1, parseInt(pageParam as string, 10) || 1);

  // Fetch data here - this is what Suspense waits for
  try {
    const searchResult = await searchArticlesPaginated({
      query: query.trim(),
      locale,
      page: currentPage,
      sort: "createdAt",
      order: "desc",
      limit: ARTICLES_PER_PAGE,
    });

    const searchResults = searchResult.data || [];
    const totalPages = searchResult.totalPages || 1;
    const totalDocs = searchResult.totalDocs || 0;

    // Get translations for updated description
    const { getTranslations } = await import("next-intl/server");
    const t = await getTranslations({ locale, namespace: "search" });

    // Create updated description with actual count
    const updatedDescription = t("resultsFound", {
      count: totalDocs,
      query: query,
    });

    return (
      <>
        <HeroCountUpdater descriptionText={updatedDescription} />
        {searchResults && searchResults.length > 0 && (
          <FeaturedArticles articles={searchResults} />
        )}
        {totalPages > 1 && (
          <PaginationSection
            type="search"
            locale={locale}
            query={query}
            page={pageParam as string}
            totalPages={totalPages}
          />
        )}
      </>
    );
  } catch (error) {
    console.error("Error searching articles:", error);
    return null;
  }
}
