import { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/app/api/v1/auth/[...nextauth]/auth";
import ErrorBoundary from "@/components/ErrorBoundary";
import { generatePrivateMetadata } from "@/lib/utils/genericMetadata";
import { categoryHeroImages } from "@/lib/constants";
import ProductsBanner from "@/components/ProductsBanner";
import HeroSection from "@/components/server/HeroSection";
import FeaturedArticles from "@/components/FeaturedArticles";
import PaginationSection from "@/components/server/PaginationSection";
import NewsletterSignup from "@/components/NewsletterSignup";
import { getUserLikedArticles } from "@/app/actions/user/getUserLikedArticles";
import { ArticlesWithPaginationSkeleton } from "@/components/skeletons/ArticlesWithPaginationSkeleton";
import HeroCountUpdater from "@/components/HeroCountUpdater";
import { HeroDescriptionProvider } from "@/components/HeroDescriptionContext";
import AdBanner from "@/components/adSence/AdBanner";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return generatePrivateMetadata(
    locale,
    "/favorites",
    "metadata.favorites.title"
  );
}

export const revalidate = 3600; // User page, cache for 1 hour

export default async function FavoritesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;

  // Server-side auth check
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${locale}/signin`);
  }

  const t = await getTranslations({ locale, namespace: "favorites" });

  // Render immediately - no blocking data fetch
  // Static components render right away, Suspense handles data loading

  const initialDescription = t("subtitle", { count: 0 });

  return (
    <main>
      <ErrorBoundary context={"Favorites page"}>
        <HeroDescriptionProvider initialDescription={initialDescription}>
          {/* Hero Section - Full width, positioned below navbar */}
          <HeroSection
            title={t("title")}
            description={initialDescription}
            imageUrl={categoryHeroImages.favorites}
            alt={t("heroImageAlt")}
          />

          <div className="container mx-auto my-8 md:my-16">
            <div className="flex flex-col h-full gap-8 md:gap-16">
              {/* Products Banner - renders immediately */}
              <ProductsBanner size="970x90" affiliateCompany="amazon" />

              {/* AdBanner */}
              <AdBanner
                dataAdSlot="4003409246"
                uniqueId="adbanner-favorites-1"
                className="hidden lg:block"
              />

              {/* Favorites Section - Suspense shows skeleton while loading */}
              <Suspense fallback={<ArticlesWithPaginationSkeleton />}>
                <FavoritesContent
                  locale={locale}
                  searchParams={searchParams}
                  userId={session.user.id}
                />
              </Suspense>

              {/* AdBanner */}
              <div className="flex justify-center gap-6">
                <AdBanner
                  dataAdSlot="5459821520"
                  uniqueId="adbanner-favorites-2"
                />
                <AdBanner
                  dataAdSlot="5459821520"
                  uniqueId="adbanner-favorites-3"
                  className="hidden md:block"
                />
                <AdBanner
                  dataAdSlot="5459821520"
                  uniqueId="adbanner-favorites-4"
                  className="hidden md:block"
                />
                <AdBanner
                  dataAdSlot="5459821520"
                  uniqueId="adbanner-favorites-5"
                  className="hidden lg:block"
                />
              </div>

              {/* Newsletter Signup Section */}
              <NewsletterSignup />

              {/* Products Banner */}
              <ProductsBanner size="970x240" affiliateCompany="amazon" />

              {/* AdBanner */}
              <div className="flex justify-center gap-6">
                <AdBanner
                  dataAdSlot="5459821520"
                  uniqueId="adbanner-favorites-6"
                />
                <AdBanner
                  dataAdSlot="5459821520"
                  uniqueId="adbanner-favorites-7"
                  className="hidden md:block"
                />
                <AdBanner
                  dataAdSlot="5459821520"
                  uniqueId="adbanner-favorites-8"
                  className="hidden md:block"
                />
                <AdBanner
                  dataAdSlot="5459821520"
                  uniqueId="adbanner-favorites-9"
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

// Favorites Content Component - handles ALL data fetching
async function FavoritesContent({
  locale,
  searchParams,
  userId,
}: {
  locale: string;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
  userId: string;
}) {
  const ARTICLES_PER_PAGE = 10;
  const resolvedParams = await searchParams;
  const pageParam = resolvedParams.page || "1";
  const currentPage = Math.max(1, parseInt(pageParam as string, 10) || 1);

  // Fetch data here - this is what Suspense waits for
  try {
    const result = await getUserLikedArticles(
      userId,
      currentPage,
      ARTICLES_PER_PAGE,
      locale
    );

    if (!result.success) {
      return null;
    }

    const articles = result.data || [];
    const totalPages = result.totalPages || 1;
    const totalDocs = result.totalDocs || 0;

    // Get translations for updated description
    const { getTranslations } = await import("next-intl/server");
    const t = await getTranslations({ locale, namespace: "favorites" });

    // Create updated description with actual count
    const updatedDescription = t("subtitle", {
      count: totalDocs,
    });

    return (
      <>
        <HeroCountUpdater descriptionText={updatedDescription} />
        {articles && articles.length > 0 && (
          <FeaturedArticles articles={articles} />
        )}
        {totalPages > 1 && (
          <PaginationSection
            type="favorites"
            locale={locale}
            page={pageParam as string}
            totalPages={totalPages}
          />
        )}
      </>
    );
  } catch (error) {
    console.error("Error fetching favorite articles:", error);
    return null;
  }
}
