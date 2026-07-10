import { Metadata } from "next";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { mainCategories, categoryHeroImages } from "@/lib/constants";
import { generatePublicMetadata } from "@/lib/utils/genericMetadata";
import ErrorBoundary from "@/components/ErrorBoundary";
import HeroSection from "@/components/server/HeroSection";
import NewsletterSection from "@/components/server/NewsletterSection";
import FeaturedArticles from "@/components/FeaturedArticles";
import PaginationSection from "@/components/server/PaginationSection";
import { getArticlesByCategoryPaginated } from "@/app/actions/article/getArticlesByCategoryPaginated";
import { FieldProjectionType } from "@/app/api/utils/fieldProjections";
import { ArticlesWithPaginationSkeleton } from "@/components/skeletons/ArticlesWithPaginationSkeleton";
import {
  translateCategoryToEnglish,
  isEnglishCategory,
  translateCategoryToLocale,
} from "@/lib/utils/routeTranslation";
import SocialMedia from "@/components/SocialMedia";
import AdBanner from "@/components/adSence/AdBanner";

// Lazy load below-fold banners (they're not critical for initial render)
const ProductsBanner = dynamic(() => import("@/components/ProductsBanner"));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}): Promise<Metadata> {
  const { category, locale } = await params;

  // Translate category from URL to English for validation
  const englishCategory = translateCategoryToEnglish(category);

  // If locale is not English, reject English category names
  if (locale !== "en" && isEnglishCategory(category)) {
    return {
      title: "Category Not Found",
      description: "The requested category could not be found",
    };
  }

  if (!mainCategories.includes(englishCategory)) {
    return {
      title: "Category Not Found",
      description: "The requested category could not be found",
    };
  }

  return generatePublicMetadata(
    locale,
    `/${category}`,
    `metadata.${englishCategory}.title`
  );
}

export const revalidate = 3600; // 1 hour

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; category: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { category, locale } = await params;
  const { page = "1" } = await searchParams;

  // Translate category from URL to English for validation
  const englishCategory = translateCategoryToEnglish(category);

  // If locale is not English, reject English category names ONLY if they differ from the locale translation
  // This allows categories like "fitness" that are the same in multiple languages
  if (locale !== "en" && isEnglishCategory(category)) {
    const expectedLocaleCategory = translateCategoryToLocale(
      englishCategory,
      locale
    );
    // Only reject if the English category is different from what's expected in this locale
    if (category.toLowerCase() !== expectedLocaleCategory.toLowerCase()) {
      notFound();
    }
  }

  // Check if category is valid - if not, trigger not-found page
  if (!mainCategories.includes(englishCategory)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "articles" });
  const heroImage =
    categoryHeroImages[englishCategory as keyof typeof categoryHeroImages] ||
    categoryHeroImages.health;

  return (
    <main>
      <ErrorBoundary context={`Articles component for category ${category}`}>
        {/* Hero Section - Full width, positioned below navbar */}
        <HeroSection
          title={t(`${englishCategory}.title`)}
          description={t(`${englishCategory}.description`)}
          imageUrl={heroImage}
          alt={t(`${englishCategory}.heroImageAlt`)}
        />

        <div className="container mx-auto my-8 md:my-16">
          <div className="flex flex-col h-full gap-8 md:gap-16">
            {/* Products Banner */}
            <ProductsBanner
              size="970x90"
              affiliateCompany="amazon"
              category={category}
            />

            {/* Social Media Section - After users see value */}
            <SocialMedia />

            {/* AdBanner - On top of the category */}
            <div className="flex justify-center gap-6">
              <AdBanner
                dataAdSlot="5459821520"
                uniqueId="adbanner-category-1"
              />
              <AdBanner
                dataAdSlot="5459821520"
                uniqueId="adbanner-category-2"
                className="hidden md:block"
              />
              <AdBanner
                dataAdSlot="5459821520"
                uniqueId="adbanner-category-3"
                className="hidden md:block"
              />
              <AdBanner
                dataAdSlot="5459821520"
                uniqueId="adbanner-category-4"
                className="hidden lg:block"
              />
            </div>

            {/* Paginated Articles Section with Pagination */}
            <Suspense fallback={<ArticlesWithPaginationSkeleton />}>
              <CategoryArticlesContent
                category={englishCategory}
                locale={locale}
                page={page as string}
                originalCategory={category}
              />
            </Suspense>

            {/* AdBanner - On top of the category */}
            <div className="flex justify-center gap-6">
              <AdBanner
                dataAdSlot="5459821520"
                uniqueId="adbanner-category-5"
              />
              <AdBanner
                dataAdSlot="5459821520"
                uniqueId="adbanner-category-6"
                className="hidden md:block"
              />
              <AdBanner
                dataAdSlot="5459821520"
                uniqueId="adbanner-category-7"
                className="hidden md:block"
              />
              <AdBanner
                dataAdSlot="5459821520"
                uniqueId="adbanner-category-8"
                className="hidden lg:block"
              />
            </div>

            {/* Newsletter Section */}
            <NewsletterSection />

            {/* Bottom banner - lazy loaded */}
            <ProductsBanner size="970x240" affiliateCompany="amazon" />

            {/* AdBanner - On top of the category */}
            <div className="flex justify-center gap-6">
              <AdBanner
                dataAdSlot="5459821520"
                uniqueId="adbanner-category-9"
              />
              <AdBanner
                dataAdSlot="5459821520"
                uniqueId="adbanner-category-10"
                className="hidden md:block"
              />
              <AdBanner
                dataAdSlot="5459821520"
                uniqueId="adbanner-category-11"
                className="hidden md:block"
              />
              <AdBanner
                dataAdSlot="5459821520"
                uniqueId="adbanner-category-12"
                className="hidden lg:block"
              />
            </div>
          </div>
        </div>
      </ErrorBoundary>
    </main>
  );
}

// Category Articles Content Component
async function CategoryArticlesContent({
  category,
  locale,
  page,
  originalCategory,
}: {
  category: string;
  locale: string;
  page: string;
  originalCategory: string;
}) {
  const ARTICLES_PER_PAGE = 9;
  const currentPage = Math.max(1, parseInt(page, 9) || 1);

  try {
    const paginatedResult = await getArticlesByCategoryPaginated({
      category,
      locale,
      page: currentPage,
      limit: ARTICLES_PER_PAGE,
      fields: "featured" as FieldProjectionType,
      skipCount: false, // Get totalPages for pagination
      ...(currentPage === 1
        ? { random: true }
        : { sort: "createdAt", order: "desc" }),
    });

    const articles = paginatedResult.data || [];
    const totalPages = paginatedResult.totalPages || 1;

    return (
      <>
        {articles && articles.length > 0 && (
          <FeaturedArticles articles={articles} />
        )}
        {totalPages > 1 && (
          <PaginationSection
            type="category"
            category={originalCategory}
            locale={locale}
            page={page}
            totalPages={totalPages}
          />
        )}
      </>
    );
  } catch (error) {
    console.error("Error fetching category articles:", error);
    return null;
  }
}
