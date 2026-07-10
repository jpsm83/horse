"use client";

import dynamic from "next/dynamic";
import ArticleCard from "./ArticleCard";
import { ISerializedArticle } from "@/types/article";
import { useLocale } from "next-intl";
import { translateCategoryToLocale } from "@/lib/utils/routeTranslation";
import AdBanner from "./adSence/AdBanner";

const ProductsBanner = dynamic(() => import("./ProductsBanner"), {
  ssr: false,
});

// Simple loading skeleton for mobile
const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(6)].map((_, i) => (
      <div
        key={i}
        className="bg-white shadow-sm overflow-hidden h-full flex flex-col"
      >
        <div className="h-40 bg-gray-200 animate-pulse" />
        <div className="p-3 flex-1 flex flex-col gap-3">
          <div className="h-4 bg-gray-200 animate-pulse rounded" />
          <div className="h-3 bg-gray-200 animate-pulse rounded" />
          <div className="h-3 bg-gray-200 animate-pulse rounded w-2/3" />
        </div>
      </div>
    ))}
  </div>
);

interface FeaturedArticlesProps {
  articles: ISerializedArticle[] | null;
  isLoading?: boolean;
}

export default function FeaturedArticles({
  articles,
  isLoading = false,
}: FeaturedArticlesProps) {
  const locale = useLocale();

  // Show loading state for mobile when loading
  if (isLoading) {
    return (
      <section>
        <LoadingSkeleton />
      </section>
    );
  }

  // Show nothing when no articles
  if (!articles || articles.length === 0) {
    return null;
  }

  return (
    <section className="cv-auto">
      {/* Featured Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 cv-auto px-3 pb-4">
        {articles.slice(0, 2).map((article: ISerializedArticle) => (
          <div key={article._id?.toString() || ""}>
            <ArticleCard article={article} />
          </div>
        ))}
        <AdBanner
          dataAdSlot="5459821520"
          uniqueId="adbanner-featureArticles-1"
        />

        {articles.slice(2, 5).map((article: ISerializedArticle) => (
          <div key={article._id?.toString() || ""}>
            <ArticleCard article={article} />
          </div>
        ))}
        <div className="h-full flex items-stretch">
          <ProductsBanner
            size="390x240"
            affiliateCompany="amazon"
            category={translateCategoryToLocale(articles[0].category, locale)}
          />
        </div>
        {articles.slice(5, 8).map((article: ISerializedArticle) => (
          <div key={article._id?.toString() || ""}>
            <ArticleCard article={article} />
          </div>
        ))}
        <AdBanner
          dataAdSlot="5459821520"
          uniqueId="adbanner-featureArticles-2"
        />
        {articles.slice(8, 9).map((article: ISerializedArticle) => (
          <div key={article._id?.toString() || ""}>
            <ArticleCard article={article} />
          </div>
        ))}
      </div>
    </section>
  );
}
