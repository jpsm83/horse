import {
  generateArticleMetadata,
  generateArticleNotFoundMetadata,
  generateSimpleFallbackMetadata,
} from "@/lib/utils/articleMetadata";
import { languageMap } from "@/lib/utils/genericMetadata";
import { IMetaDataArticle } from "@/types/article";
import ErrorBoundary from "@/components/ErrorBoundary";
import { getArticleBySlug } from "@/app/actions/article/getArticleBySlug";
import ArticleWithDeleteModal from "@/components/ArticleWithDeleteModal";
import { Metadata, Viewport } from "next";
import { mainCategories } from "@/lib/constants";
import { notFound } from "next/navigation";
import ProductsBanner from "@/components/ProductsBanner";
import CommentsSection from "@/components/CommentsSection";
import CategoryCarousel from "@/components/CategoryCarousel";
import { getTranslations } from "next-intl/server";
import SocialShare from "@/components/SocialShare";
import SectionHeader from "@/components/server/SectionHeader";
import {
  translateCategoryToEnglish,
  isEnglishCategory,
  translateCategoryToLocale,
} from "@/lib/utils/routeTranslation";
import AdBanner from "@/components/adSence/AdBanner";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string; category: string }>;
}): Promise<Metadata> {
  const { slug, locale, category } = await params;

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
      return generateArticleNotFoundMetadata();
    }
  }

  // Validate category exists
  if (!mainCategories.includes(englishCategory)) {
    return generateArticleNotFoundMetadata();
  }

  try {
    const articleData = await getArticleBySlug(slug, locale);

    if (!articleData) {
      return generateArticleNotFoundMetadata();
    }

    // Validate article category matches URL category (using English)
    if (articleData.category !== englishCategory) {
      return generateArticleNotFoundMetadata();
    }

    const languageData = articleData.languages[0]; // Already filtered by API
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.VERCEL_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://womensspot.org";
    const canonicalUrl = `${baseUrl}/${locale}/${category}/${slug}`;

    const metaContent: IMetaDataArticle = {
      slug: slug,
      createdBy:
        typeof articleData.createdBy === "object" &&
        articleData.createdBy &&
        "username" in articleData.createdBy
          ? (articleData.createdBy as { username: string }).username
          : "Women's Spot Team",
      postImage: languageData?.postImage, // Add the language-specific postImage
      category: articleData.category,
      createdAt: articleData.createdAt
        ? new Date(articleData.createdAt)
        : new Date(),
      updatedAt: articleData.updatedAt
        ? new Date(articleData.updatedAt)
        : new Date(),
      socialMedia: languageData?.socialMedia,
      seo: languageData?.seo
        ? {
            ...languageData.seo,
            canonicalUrl: languageData.seo.canonicalUrl || canonicalUrl,
            hreflang:
              languageData.seo.hreflang || languageMap[locale] || locale,
            slug: languageData.seo.slug || slug,
          }
        : {
            metaTitle: `${
              articleData.category.charAt(0).toUpperCase() +
              articleData.category.slice(1)
            } Article - Women's Spot`,
            metaDescription: `Discover valuable insights about ${articleData.category} on Women's Spot. Expert health and wellness advice for women.`,
            keywords: [
              articleData.category,
              "health",
              "women",
              "wellness",
              "fitness",
              "nutrition",
            ],
            slug: slug,
            hreflang: languageMap[locale] || locale,
            canonicalUrl: canonicalUrl,
          },
    };

    const metadata = await generateArticleMetadata(metaContent);
    return metadata;
  } catch (error) {
    // Only log unexpected errors (database failures, etc.)
    // Not logging expected "article not found" cases
    if (error instanceof Error && !error.message.includes("not found")) {
      console.error("Unexpected error generating article metadata:", error);
    }

    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.VERCEL_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://womensspot.org";
    const fallbackCanonicalUrl = `${baseUrl}/${locale}/${category}/${slug}`;

    const fallbackMetaContent: IMetaDataArticle = {
      slug: slug,
      createdBy: "Women's Spot Team",
      postImage: undefined, // No postImage for fallback
      category: "health",
      createdAt: new Date(),
      updatedAt: new Date(),
      socialMedia: undefined,
      seo: {
        metaTitle: `Health Article - Women's Spot`,
        metaDescription: `Discover valuable health insights and wellness tips on Women's Spot. Expert advice for women's health and wellness.`,
        keywords: [
          "health",
          "women",
          "wellness",
          "fitness",
          "nutrition",
          "mental health",
          "lifestyle",
          "Women's Spot",
        ],
        slug: slug,
        hreflang: languageMap[locale] || locale,
        canonicalUrl: fallbackCanonicalUrl,
      },
    };

    try {
      const fallbackMetadata = await generateArticleMetadata(
        fallbackMetaContent
      );
      return fallbackMetadata;
    } catch (fallbackError) {
      // Only log if it's an unexpected error
      if (
        fallbackError instanceof Error &&
        !fallbackError.message.includes("not found")
      ) {
        console.error("Error generating fallback metadata:", fallbackError);
      }
      return generateSimpleFallbackMetadata(slug, locale, "health");
    }
  }
}

// Generate viewport metadata separately (Next.js 15+ requirement)
export async function generateViewport(): Promise<Viewport> {
  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  };
}

export const revalidate = 3600; // 1 hour

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string; locale: string; category: string }>;
}) {
  const { slug, locale, category } = await params;
  const t = await getTranslations({ locale, namespace: "article" });

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

  // Validate category exists
  if (!mainCategories.includes(englishCategory)) {
    notFound();
  }

  // Fetch article data with graceful error handling
  let articleData;
  try {
    articleData = await getArticleBySlug(slug, locale);
  } catch (error) {
    // Only log unexpected errors (database connection failures, etc.)
    if (error instanceof Error && !error.message.includes("not found")) {
      console.error("Unexpected error fetching article:", error);
    }
    articleData = null;
  }

  // If article doesn't exist, trigger not-found page (no logging needed)
  if (!articleData) {
    notFound();
  }

  // Validate article category matches URL category (using English)
  if (articleData.category !== englishCategory) {
    notFound();
  }

  // Construct share URL
  const baseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.VERCEL_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://womensspot.org";
  const shareUrl = `${baseUrl}/${locale}/${category}/${slug}`;

  // Get share data
  const languageData = articleData.languages[0];
  const shareTitle = languageData?.content?.mainTitle || "";
  const shareDescription =
    languageData?.content?.articleContents?.[0]?.articleParagraphs?.[0] || "";
  const shareMedia = articleData.articleImages?.[0] || "";

  return (
    <main className="container mx-auto my-8 md:my-16">
      <ErrorBoundary context={"Article component"}>
        <div className="flex flex-col h-full gap-8 md:gap-16">
          {/* Products Banner */}
          <ProductsBanner
            size="970x90"
            affiliateCompany="amazon"
            category={category}
          />

          {/* Article Detail Section */}
          <ArticleWithDeleteModal articleData={articleData} />

          {/* Social Share Section */}
          <div className="text-center">
            <SocialShare
              url={shareUrl}
              title={shareTitle}
              description={shareDescription}
              media={shareMedia}
            />
          </div>

          {/* Comments Section */}
          <CommentsSection articleId={articleData._id.toString()} />

          {/* AdBanner - On top of the article */}
          <div className="flex justify-center gap-6">
            <AdBanner dataAdSlot="5459821520" uniqueId="adbanner-slug-1" />
            <AdBanner
              dataAdSlot="5459821520"
              uniqueId="adbanner-slug-2"
              className="hidden md:block"
            />
            <AdBanner
              dataAdSlot="5459821520"
              uniqueId="adbanner-slug-3"
              className="hidden md:block"
            />
            <AdBanner
              dataAdSlot="5459821520"
              uniqueId="adbanner-slug-4"
              className="hidden lg:block"
            />
          </div>

          {/* Explore by Category Section */}
          <section className="space-y-6 md:space-y-12">
            <SectionHeader
              title={t("exploreMore")}
              description={t("exploreMoreDescription")}
            />

            {/* Category Carousel Section */}
            <CategoryCarousel category={articleData.category} />
          </section>

          {/* Bottom banner - lazy loaded */}
          <ProductsBanner size="970x240" affiliateCompany="amazon" />

          {/* AdBanner - On top of the article */}
          <div className="flex justify-center gap-6">
            <AdBanner dataAdSlot="5459821520" uniqueId="adbanner-slug-5" />
            <AdBanner
              dataAdSlot="5459821520"
              uniqueId="adbanner-slug-6"
              className="hidden md:block"
            />
            <AdBanner
              dataAdSlot="5459821520"
              uniqueId="adbanner-slug-7"
              className="hidden md:block"
            />
            <AdBanner
              dataAdSlot="5459821520"
              uniqueId="adbanner-slug-8"
              className="hidden lg:block"
            />
          </div>
        </div>
      </ErrorBoundary>
    </main>
  );
}
