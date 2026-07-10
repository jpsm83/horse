"use client";

import { Clock, MoreHorizontal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { translateCategoryToLocale } from "@/lib/utils/routeTranslation";
import { ISerializedArticle } from "@/types/article";
import {
  calculateReadTime,
  generateExcerpt,
} from "@/lib/utils/readTimeCalculator";
import { useState } from "react";
import dynamic from "next/dynamic";
const SocialShare = dynamic(() => import("./SocialShare"), { ssr: false });
import { Button } from "./ui/button";
import { ImageOff } from "lucide-react";
import { optimizeCloudinaryUrl } from "@/lib/utils/optimizeCloudinaryUrl";
export default function ArticleCard({
  article,
}: {
  article: ISerializedArticle;
}) {
  const [showShareDropdown, setShowShareDropdown] = useState(false);
  const t = useTranslations("articleCard");
  const locale = useLocale();

  // Calculate read time and generate excerpt
  const readTimeMinutes = calculateReadTime(article);
  const readTime = t("readTime", { time: readTimeMinutes });
  const excerpt = generateExcerpt(article, t);

  // Generate article URL - use canonical URL if available, otherwise construct with translated category
  const canonicalUrl = article.languages[0]?.seo?.canonicalUrl;
  const articleUrl = canonicalUrl
    ? new URL(canonicalUrl).pathname
    : `/${locale}/${translateCategoryToLocale(article.category, locale)}/${article.languages[0].seo.slug}`;

  // Generate share URL and title
  const shareUrl =
    typeof window !== "undefined"
      ? canonicalUrl
        ? canonicalUrl
        : `${window.location.origin}/${locale}/${translateCategoryToLocale(article.category, locale)}/${article.languages[0].seo.slug}`
      : "";
  const shareTitle = article.languages[0].content.mainTitle;
  const shareMedia =
    article.articleImages && article.articleImages.length > 0
      ? article.articleImages[0]
      : "";

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowShareDropdown(!showShareDropdown);
  };

  const handleCardClick = () => {
    if (showShareDropdown) {
      setShowShareDropdown(false);
    }
  };

  return (
    <div
      className="bg-white shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden h-full flex flex-col relative"
      onClick={handleCardClick}
    >
      <Link
        href={articleUrl}
        className="flex flex-col h-full cursor-pointer"
        prefetch={false}
      >
        {/* Article Images - Two images side by side */}
        <div className="relative overflow-hidden h-40 flex-shrink-0 flex group">
          {article.articleImages && article.articleImages.length > 0 ? (
            <>
              {/* First Image */}
              <div className="relative w-1/2 h-full">
                <Image
                  src={optimizeCloudinaryUrl(article.articleImages[0])}
                  alt={article.languages[0].content.mainTitle}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                  loading="lazy"
                  quality={75}
                />
              </div>
              {/* Second Image */}
              <div className="relative w-1/2 h-full">
                {article.articleImages.length > 1 &&
                article.articleImages[1] ? (
                  <Image
                    src={optimizeCloudinaryUrl(article.articleImages[1])}
                    alt={article.languages[0].content.mainTitle}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                    loading="lazy"
                    quality={75}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <div className="flex flex-col items-center justify-center text-center text-gray-500">
                      <ImageOff size={20} />
                      <div className="text-xs font-medium">No Image</div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <div className="flex flex-col items-center justify-center text-center text-gray-500">
                <ImageOff size={24} />
                <div className="text-sm font-medium">No Images</div>
              </div>
            </div>
          )}
          <div className="absolute top-2 left-2 z-10">
            <span className="bg-gradient-left-right text-white border border-white text-xs font-medium px-2 py-1 rounded-full capitalize shadow-2xl">
              {t(`categories.${article.category}`)}
            </span>
          </div>
          {/* Share Button - Top Right */}
          <div className="absolute bottom-2 right-2 z-10">
            <Button
              onClick={handleShareClick}
              className="bg-black/40 hover:bg-black/60 text-white border border-white rounded-full transition-all duration-200 hover:shadow-sm backdrop-blur-sm"
              title="Share article"
            aria-label="Share article"
            >
              <MoreHorizontal size={16} />
            </Button>
          </div>

          {/* Share Dropdown */}
          {showShareDropdown && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute top-0 z-20 bg-black/60 backdrop-blur-xs shadow-2xl p-3"
            >
              <SocialShare
                url={shareUrl}
                title={shareTitle}
                description={excerpt}
                media={shareMedia}
              />
            </div>
          )}
        </div>

        {/* Article Content - Reduced padding and spacing */}
        <div className="p-3 flex-1 flex flex-col gap-3">
          {/* Title - Smaller fixed height */}
          <h3 className="font-semibold text-gray-900 leading-tight hover:text-orange-600 transition-colors duration-200">
            {article.languages[0].content.mainTitle}
          </h3>

          {/* Excerpt - Smaller minimum height */}
          <p className="text-gray-600 text-xs">{excerpt}</p>

          {/* Meta Information - Read time only */}
          <div className="flex items-center justify-end text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{readTime}</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
