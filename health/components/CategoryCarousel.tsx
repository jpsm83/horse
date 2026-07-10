"use client";

import dynamic from "next/dynamic";
import { ISerializedArticle } from "@/types/article";
import ArticleCard from "./ArticleCard";

const ProductsBanner = dynamic(() => import("./ProductsBanner"), {
  ssr: false,
});
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { useTranslations, useLocale } from "next-intl";
import { translateCategoryToLocale } from "@/lib/utils/routeTranslation";
import { CategoryCarouselSkeleton } from "@/components/skeletons/CategoryCarouselSkeleton";

import { useState, useEffect, useCallback, useRef } from "react";
import { getArticlesByCategory } from "@/app/actions/article/getArticlesByCategory";

interface CategoryCarouselProps {
  category: string;
  initialArticles?: ISerializedArticle[];
}

export default function CategoryCarousel({
  category,
  initialArticles = [],
}: CategoryCarouselProps) {
  const t = useTranslations("categoryCarousel");
  const tArticleCard = useTranslations("articleCard");
  const locale = useLocale();

  const [articles, setArticles] = useState<ISerializedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const limit = 6;
  const [api, setApi] = useState<CarouselApi>();
  const initialized = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize with pre-fetched articles or fetch if not provided
  useEffect(() => {
    if (initialized.current) return;

    // Create abort controller for this effect
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    let isMounted = true;

    if (initialArticles !== undefined && initialArticles.length > 0) {
      // Use pre-fetched articles (only if not empty)
      if (!abortController.signal.aborted && isMounted) {
        setArticles(initialArticles);
        setLoading(false);
        setHasMore(initialArticles.length >= limit);
        initialized.current = true;
      }
    } else {
      // Fetch articles if not provided (fallback for backward compatibility)
      const fetchArticles = async () => {
        if (abortController.signal.aborted || !isMounted) return;

        setLoading(true);
        setError(null);

        try {
          const fetchedArticles = await getArticlesByCategory({
            category,
            page: 1,
            limit,
            locale,
            fields: "featured", // Only fetch fields needed for ArticleCard
            skipCount: true, // Skip expensive countDocuments
            random: true,
          });

          // Check if component is still mounted and not aborted
          if (abortController.signal.aborted || !isMounted) return;

          // Check if fetchedArticles is valid and has data property
          if (!fetchedArticles || !fetchedArticles.data) {
            console.warn(`No data returned for category: ${category}`);
            if (!abortController.signal.aborted && isMounted) {
              setArticles([]);
              setHasMore(false);
            }
            return;
          }

          // Filter out any duplicate articles by ID
          const uniqueArticles = fetchedArticles.data.filter(
            (article, index, self) =>
              index ===
              self.findIndex(
                (a) => a._id?.toString() === article._id?.toString()
              )
          );

          if (!abortController.signal.aborted && isMounted) {
            setArticles(uniqueArticles);
            setHasMore(uniqueArticles.length >= limit);
          }
        } catch (err) {
          // Only update state if component is still mounted and not aborted
          if (abortController.signal.aborted || !isMounted) return;

          const message =
            err instanceof Error ? err.message : t("failedToFetchArticles");
          setError(message);
          console.error(`Error fetching ${category} articles:`, err);

          // Log mobile-specific debugging info
          console.error("Mobile carousel error context:", {
            category,
            locale,
            userAgent: navigator?.userAgent,
            timestamp: new Date().toISOString(),
            error: err instanceof Error ? err.message : "Unknown error",
          });
        } finally {
          if (!abortController.signal.aborted && isMounted) {
            setLoading(false);
            initialized.current = true;
          }
        }
      };

      fetchArticles();
    }

    // Cleanup function
    return () => {
      isMounted = false;
      abortController.abort();
      abortControllerRef.current = null;
    };
  }, [category, limit, locale, t, initialArticles]);

  // Load more articles
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    // Create abort controller for this loadMore call
    const abortController = new AbortController();
    const isMounted = true;

    setLoadingMore(true);
    setError(null);

    try {
      const excludeIds = articles
        .map((article) => article._id?.toString())
        .filter((id): id is string => Boolean(id));

      const newArticles = await getArticlesByCategory({
        category,
        limit,
        excludeIds,
        locale,
        fields: "featured", // Only fetch fields needed for ArticleCard
        random: true,
      });

      // Check if component is still mounted and not aborted
      if (abortController.signal.aborted || !isMounted) return;

      if (newArticles.data.length === 0) {
        if (!abortController.signal.aborted && isMounted) {
          setHasMore(false);
        }
      } else {
        // Filter out any duplicate articles by ID
        if (!abortController.signal.aborted && isMounted) {
          setArticles((prev) => {
            const existingIds = new Set(
              prev.map((article) => article._id?.toString())
            );
            const uniqueNewArticles = newArticles.data.filter(
              (article) => !existingIds.has(article._id?.toString())
            );

            return [...prev, ...uniqueNewArticles];
          });
        }
      }
    } catch (err) {
      // Only update state if component is still mounted and not aborted
      if (abortController.signal.aborted || !isMounted) return;

      setError(
        err instanceof Error ? err.message : t("failedToFetchMoreArticles")
      );
    } finally {
      if (!abortController.signal.aborted && isMounted) {
        setLoadingMore(false);
      }
    }
  }, [category, articles, limit, loadingMore, hasMore, locale, t]);

  // Embla scroll event listener - trigger loadMore when reaching end
  useEffect(() => {
    if (!api || !hasMore || loadingMore) return;

    const handleScroll = () => {
      if (!api.canScrollNext() && hasMore && !loadingMore) {
        loadMore();
      }
    };

    api.on("scroll", handleScroll);

    return () => {
      api.off("scroll", handleScroll);
    };
  }, [api, hasMore, loadingMore, loadMore]);

  if (articles.length === 0 && !loading) {
    return null;
  }

  // Show skeleton while loading
  if (loading && articles.length === 0) {
    return <CategoryCarouselSkeleton />;
  }

  const categoryTitle = tArticleCard(`categories.${category}`);

  return (
    <>
      {/* Category Header */}
      <div className="flex items-center justify-between mb-6 px-6">
        <a
          href={`/${locale}/${translateCategoryToLocale(category, locale)}`}
          className="text-2xl font-bold text-white capitalize transition-colors duration-200 cursor-pointer"
          style={{
            textShadow: "2px 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.4)",
          }}
        >
          {categoryTitle}
        </a>
        <div className="flex items-center gap-4">
          <a
            href={`/${locale}/${translateCategoryToLocale(category, locale)}`}
            className="text-gray-600 hover:text-gray-800 font-medium text-sm transition-colors duration-200"
          >
            {t("viewAll")} →
          </a>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="text-center py-4 text-red-600">
          {t("errorLoading")} {error}
        </div>
      )}

      {/* Carousel */}
      <div className="relative sm:px-6 md:px-12 cv-auto">
        <Carousel
          setApi={setApi}
          opts={{
            align: "start",
            loop: false,
            containScroll: "trimSnaps",
            dragFree: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4 pb-4">
            {articles
              .map((article, index) => {
                const items = [];

                // Add article card
                items.push(
                  <CarouselItem
                    key={`article-${
                      article._id?.toString() || "unknown"
                    }-${index}`}
                    className="pl-2 md:pl-4 basis-64 shrink-0"
                  >
                    <ArticleCard article={article} />
                  </CarouselItem>
                );

                // Add banner after every 5 articles (after index 4, 9, 14, etc.)
                if ((index + 1) % 4 === 0 && index < articles.length - 1) {
                  items.push(
                    <CarouselItem
                      key={`banner-${index}`}
                      className="pl-2 md:pl-4 basis-64 shrink-0"
                    >
                      <div className="h-full">
                        <ProductsBanner
                          size="240x390"
                          category={translateCategoryToLocale(category, locale)}
                          affiliateCompany="amazon"
                        />
                      </div>
                    </CarouselItem>
                  );
                }

                return items;
              })
              .flat()}
          </CarouselContent>

          {/* Navigation Buttons */}
          <CarouselPrevious
            className="left-0 rounded-none border-none h-full bg-gradient-to-r from-[#d1d5db] to-transparent hover:bg-gradient-to-r hover:from-[#a9adb1] hover:to-transparent transition-colors duration-500 ease-in-out
"
          />

          <CarouselNext
            className="right-0 rounded-none border-none h-full bg-gradient-to-l from-[#d1d5db] to-transparent hover:bg-gradient-to-l hover:from-[#a9adb1] hover:to-transparent transition-colors duration-500 ease-in-out
"
          />
        </Carousel>
      </div>
    </>
  );
}
