import { redirect } from "next/navigation";
import { auth } from "@/app/api/v1/auth/[...nextauth]/auth";
import { getArticlesCount } from "@/app/actions/article/getArticlesCount";
import { translateCategoryToEnglish } from "@/lib/utils/routeTranslation";
import { searchArticlesPaginated } from "@/app/actions/article/searchArticlesPaginated";
import { getUserLikedArticles } from "@/app/actions/user/getUserLikedArticles";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import PaginationPrefetcher from "@/components/PaginationPrefetcher";

type PaginationType = "category" | "search" | "favorites";

interface PaginationSectionProps {
  type: PaginationType;
  locale: string;
  page: string;
  category?: string; // Required for "category" type
  query?: string; // Required for "search" type
  totalPages?: number; // Optional: if provided, use it instead of fetching
}

const ARTICLES_PER_PAGE = 10;

export default async function PaginationSection({
  type,
  locale,
  page,
  category,
  query,
  totalPages: providedTotalPages,
}: PaginationSectionProps) {
  const currentPage = Math.max(1, parseInt(page, 10) || 1);

  try {
    let totalPages = 1;

    // Use provided totalPages if available, otherwise fetch
    if (providedTotalPages !== undefined) {
      totalPages = providedTotalPages;
    } else if (type === "category") {
      if (!category) {
        return null;
      }
      // Translate category to English for database query
      const englishCategory = translateCategoryToEnglish(category);
      const totalArticles = await getArticlesCount({ category: englishCategory, locale });
      totalPages = Math.ceil(totalArticles / ARTICLES_PER_PAGE);
    } else if (type === "search") {
      if (!query) {
        return null;
      }
      const searchResult = await searchArticlesPaginated({
        query: query.trim(),
        locale,
        page: currentPage,
        sort: "createdAt",
        order: "desc",
        limit: ARTICLES_PER_PAGE,
      });
      totalPages = searchResult.totalPages || 1;
    } else if (type === "favorites") {
      const session = await auth();
      if (!session?.user?.id) {
        return null;
      }
      const result = await getUserLikedArticles(
        session.user.id,
        currentPage,
        ARTICLES_PER_PAGE,
        locale
      );
      if (!result.success) {
        return null;
      }
      totalPages = result.totalPages || 1;
    }

    // Build redirect URL based on type
    let redirectUrl = "";
    if (type === "category" && category) {
      redirectUrl = `/${locale}/${category}?page=1`;
    } else if (type === "search" && query) {
      redirectUrl = `/${locale}/search?q=${encodeURIComponent(query)}&page=1`;
    } else if (type === "favorites") {
      redirectUrl = `/${locale}/favorites?page=1`;
    }

    // Redirect to page 1 if current page is greater than total pages
    if (currentPage > totalPages && totalPages > 0 && redirectUrl) {
      redirect(redirectUrl);
    }

    // Don't render if only one page
    if (totalPages <= 1) {
      return null;
    }

    // Build URL helper function
    const buildPageUrl = (pageNum: number): string => {
      if (type === "category" && category) {
        return `/${locale}/${category}?page=${pageNum}`;
      } else if (type === "search" && query) {
        return `/${locale}/search?q=${encodeURIComponent(query)}&page=${pageNum}`;
      } else if (type === "favorites") {
        return `/${locale}/favorites?page=${pageNum}`;
      }
      return "";
    };

    return (
      <section>
        {/* Prefetch adjacent pages for instant navigation */}
        <PaginationPrefetcher
          previousUrl={currentPage > 1 ? buildPageUrl(currentPage - 1) : undefined}
          nextUrl={currentPage < totalPages ? buildPageUrl(currentPage + 1) : undefined}
        />
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              {/* Previous Button */}
              {currentPage > 1 && (
                <PaginationItem>
                  <PaginationPrevious href={buildPageUrl(currentPage - 1)} />
                </PaginationItem>
              )}

              {/* Page Numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNum) => {
                  // Show first page, last page, current page, and pages around current page
                  const shouldShow =
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    Math.abs(pageNum - currentPage) <= 1;

                  if (!shouldShow) {
                    // Show ellipsis for gaps
                    if (pageNum === 2 && currentPage > 4) {
                      return (
                        <PaginationItem key={`ellipsis-start-${pageNum}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    if (
                      pageNum === totalPages - 1 &&
                      currentPage < totalPages - 3
                    ) {
                      return (
                        <PaginationItem key={`ellipsis-end-${pageNum}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  }

                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href={buildPageUrl(pageNum)}
                        isActive={pageNum === currentPage}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
              )}

              {/* Next Button */}
              {currentPage < totalPages && (
                <PaginationItem>
                  <PaginationNext href={buildPageUrl(currentPage + 1)} />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      </section>
    );
  } catch (error) {
    console.error(`Error calculating ${type} pagination data:`, error);
    return null;
  }
}

