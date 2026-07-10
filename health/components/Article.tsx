"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { ISerializedArticle } from "@/types/article";
import Image from "next/image";
import { toggleArticleLike } from "@/app/actions/article/toggleArticleLike";
import { incrementArticleViews } from "@/app/actions/article/incrementArticleViews";
import { Heart, Trash2, ImageOff } from "lucide-react";
import { optimizeCloudinaryUrl } from "@/lib/utils/optimizeCloudinaryUrl";
import NewsletterSignup from "@/components/NewsletterSignup";
import { showToast } from "@/components/Toasts";
import { Button } from "@/components/ui/button";
import SocialShare from "@/components/SocialShare";
import ProductsBanner from "@/components/ProductsBanner";
import SocialMedia from "@/components/SocialMedia";
import { translateCategoryToLocale } from "@/lib/utils/routeTranslation";
import AdBanner from "./adSence/AdBanner";

export default function Article({
  articleData,
  onDeleteClick,
}: {
  articleData: ISerializedArticle | undefined;
  onDeleteClick?: () => void;
}) {
  const [likes, setLikes] = useState<number>(articleData?.likes?.length || 0);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const isTogglingLike = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { data: session } = useSession();
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations();

  // Track if component is mounted to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check if user has liked the article
  useEffect(() => {
    if (session?.user?.id && articleData?.likes) {
      setIsLiked(
        articleData?.likes.some((like) => like.toString() === session.user.id)
      );
    }
  }, [session, articleData?.likes]);

  // Track article views - one view per session (session managed by SessionTracker)
  useEffect(() => {
    if (!articleData?._id || session?.user?.id === "68e6a79afb1932c067f96e30")
      return;

    // Create abort controller for this effect
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    let isMounted = true;

    const sessionKey = `viewed_article_${articleData._id}`;
    if (sessionStorage.getItem(sessionKey)) {
      // Already viewed in this session, just return cleanup
      return () => {
        isMounted = false;
        abortController.abort();
        abortControllerRef.current = null;
      };
    }

    // Increment view and mark as viewed
    incrementArticleViews(articleData._id).then((result) => {
      // Only update if component is still mounted and not aborted
      if (abortController.signal.aborted || !isMounted) return;
      if (result.success) sessionStorage.setItem(sessionKey, "true");
    });

    // Cleanup function
    return () => {
      isMounted = false;
      abortController.abort();
      abortControllerRef.current = null;
    };
  }, [articleData?._id, session?.user?.id]);

  // toggle article like
  const toggleLike = async () => {
    if (!session?.user?.id) {
      router.push("/signin");
      return;
    }

    // Prevent rapid clicks - guard against concurrent calls
    if (isTogglingLike.current) return;
    isTogglingLike.current = true;

    try {
      const result = await toggleArticleLike(
        articleData?._id?.toString() || "",
        session?.user?.id || ""
      );

      if (result.success) {
        setLikes(result.likeCount || 0);
        setIsLiked(result.liked || false);
        if (result.liked) {
          showToast(
            "success",
            t("article.toasts.likedSuccess"),
            t("article.toasts.likedSuccessMessage")
          );
        } else {
          showToast(
            "success",
            t("article.toasts.unlikedSuccess"),
            t("article.toasts.unlikedSuccessMessage")
          );
        }
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      showToast(
        "error",
        t("article.toasts.likeError"),
        t("article.toasts.likeErrorMessage")
      );
    } finally {
      // Reset the guard after a short delay to prevent rapid clicks
      setTimeout(() => {
        isTogglingLike.current = false;
      }, 500);
    }
  };

  // Check if current user is admin
  const isAdmin = () => {
    return session?.user?.role === "admin";
  };

  // Calculate content distribution across 4 containers
  const calculateContentDistribution = () => {
    const totalContent =
      articleData?.languages?.[0]?.content?.articleContents?.length || 0;
    const totalImages = articleData?.articleImages?.length || 0;

    const containers = [];

    // Always create exactly 4 containers
    for (let i = 0; i < 4; i++) {
      // Each container has 2 images side by side with overlapping pattern
      // Container 0: images 0,1
      // Container 1: images 1,2
      // Container 2: images 2,3
      // Container 3: images 3,0 (wraps back to first)
      const firstImageIndex = i;
      const secondImageIndex = i === 3 ? 0 : i + 1;

      const firstImage =
        totalImages > firstImageIndex
          ? articleData?.articleImages?.[firstImageIndex]
          : null;
      const secondImage =
        totalImages > secondImageIndex
          ? articleData?.articleImages?.[secondImageIndex]
          : null;

      // Calculate how many content sections this container should have
      let contentCount = 0;
      let startIndex = 0;

      if (totalContent > 0) {
        // Calculate base content per container
        const baseContentPerContainer = Math.floor(totalContent / 4);
        const remainingContent = totalContent % 4;

        if (i < remainingContent) {
          // First 'remainingContent' containers get one extra content
          contentCount = baseContentPerContainer + 1;
          startIndex = i * (baseContentPerContainer + 1);
        } else {
          // Remaining containers get base content
          contentCount = baseContentPerContainer;
          startIndex =
            remainingContent * (baseContentPerContainer + 1) +
            (i - remainingContent) * baseContentPerContainer;
        }
      }

      const containerContent =
        articleData?.languages?.[0]?.content?.articleContents?.slice(
          startIndex,
          startIndex + contentCount
        ) || [];

      containers.push({
        firstImage,
        secondImage,
        content: containerContent,
        containerIndex: i,
        firstImageIndex,
        secondImageIndex,
      });
    }

    return containers;
  };

  const containers = calculateContentDistribution();

  // Generate share URL and data
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareTitle = articleData?.languages[0]?.content?.mainTitle || "";
  const shareDescription =
    articleData?.languages[0]?.content?.articleContents?.[0]
      ?.articleParagraphs?.[0] || "";
  const shareMedia =
    articleData?.articleImages && articleData.articleImages.length > 0
      ? articleData.articleImages[0]
      : "";

  return (
    <div className="space-y-8 md:space-y-16">
      {/* Article Content in 4 Containers */}
      {containers.map((container, containerIndex) => (
        <div key={containerIndex} className="space-y-8 md:space-y-16">
          {/* Newsletter Signup in the 4th container (index 3) */}
          {containerIndex === 3 && <NewsletterSignup />}
          <div className="overflow-hidden text-justify space-y-8 md:space-y-16">
            {/* AdBanner */}
            {containerIndex !== 0 && (
              <div className="flex justify-center gap-6">
                <AdBanner
                  dataAdSlot="5459821520"
                  uniqueId={`adbanner-article-${containerIndex + 1}`}
                />
                <AdBanner
                  dataAdSlot="5459821520"
                  uniqueId={`adbanner-article-${containerIndex + 2}`}
                  className="hidden md:block"
                />
                <AdBanner
                  dataAdSlot="5459821520"
                  uniqueId={`adbanner-article-${containerIndex + 3}`}
                  className="hidden md:block"
                />
                <AdBanner
                  dataAdSlot="5459821520"
                  uniqueId={`adbanner-article-${containerIndex + 4}`}
                  className="hidden lg:block"
                />
              </div>
            )}

            {/* Container Images - 2 images side by side on lg+, 1 image on smaller screens */}
            <div
              className={`relative w-full h-[55vh] min-h-[320px] md:h-[70vh] md:min-h-[500px] flex ${
                containerIndex === 0 ? "mb-24" : ""
              }`}
            >
              {/* First Image - Always visible */}
              <div className="relative w-full lg:w-1/2 h-full">
                {container.firstImage && container.firstImage.trim() !== "" ? (
                  <Image
                    src={optimizeCloudinaryUrl(container.firstImage, 85)}
                    alt={`${
                      articleData?.languages[0]?.content?.mainTitle || "Article"
                    }${t("article.imageAlt")}${container.firstImageIndex + 1}`}
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                    fetchPriority="high"
                    quality={85}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <div className="flex flex-col items-center justify-center text-center text-gray-500">
                      <ImageOff size={24} />
                      <div className="text-sm font-medium">No Image</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Second Image - Only visible on lg+ screens */}
              <div className="relative hidden lg:block w-1/2 h-full">
                {container.secondImage &&
                container.secondImage.trim() !== "" ? (
                  <Image
                    src={optimizeCloudinaryUrl(container.secondImage, 85)}
                    alt={`${
                      articleData?.languages[0]?.content?.mainTitle || "Article"
                    }${t("article.imageAlt")}${container.secondImageIndex + 1}`}
                    fill
                    className="object-cover object-center"
                    sizes="50vw"
                    priority
                    fetchPriority="high"
                    quality={85}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <div className="flex flex-col items-center justify-center text-center text-gray-500">
                      <ImageOff size={24} />
                      <div className="text-sm font-medium">No Image</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Overlay Header for first container only */}
              {containerIndex === 0 && (
                <div className="absolute inset-0 bg-linear-to-b from-black/20 via-black/30 to-black/40 flex flex-col justify-center items-center text-center px-4">
                  {/* Delete Button - Top Right - Only render after mount to prevent hydration mismatch */}
                  {isMounted && isAdmin() && onDeleteClick && (
                    <div className="absolute top-4 right-4">
                      <button
                        onClick={onDeleteClick}
                        className="flex items-center justify-center w-8 h-8 bg-white/20 hover:bg-red-700 text-white border border-white transition-colors cursor-pointer rounded-full backdrop-blur-sm"
                        title={t("article.actions.delete")}
                      >
                        <Trash2 className="size-6" />
                      </button>
                    </div>
                  )}

                  <h1
                    className="text-4xl md:text-7xl font-bold text-white mb-6 md:mb-12 cursor-default drop-shadow-2xl"
                    style={{
                      textShadow:
                        "2px 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.6)",
                    }}
                  >
                    {articleData?.languages[0].content.mainTitle}
                  </h1>
                  <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-4xl">
                    <div
                      className="flex flex-wrap items-center justify-center font-semibold text-xs md:text-sm text-gray-200 gap-4 cursor-default drop-shadow-xl"
                      style={{
                        textShadow:
                          "1px 1px 3px rgba(0,0,0,0.8), 0 0 6px rgba(0,0,0,0.5)",
                      }}
                    >
                      <span>
                        {t("article.info.category")} {articleData?.category}
                      </span>
                      <span>
                        {t("article.info.views")}{" "}
                        {(articleData?.views || 0) + 97}
                      </span>
                      <span>
                        {t("article.info.likes")} {likes + 79}
                      </span>
                      {/* Like Button at Top */}
                      <div className="flex justify-center items-center">
                        <Button
                          onClick={toggleLike}
                          className={`cursor-pointer bg-transparent border-none hover:bg-transparent hover:scale-110 transition-all duration-200 shadow-none ${
                            isLiked ? "text-red-600" : "text-gray-200"
                          }`}
                        >
                          <Heart
                            className={`size-8 ${
                              isLiked
                                ? "fill-red-600 stroke-white stroke-[1.5]"
                                : "stroke-current fill-none"
                            }`}
                          />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {/* Social Share Buttons - Inside Hero Image at Bottom */}
                  <div className="absolute bottom-[-60px] left-1/2 transform -translate-x-1/2 p-1 w-full">
                    <SocialShare
                      url={shareUrl}
                      title={shareTitle}
                      description={shareDescription}
                      media={shareMedia}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* AdBanner */}
            {containerIndex === 0 && (
              <div className="flex justify-center gap-6">
                <AdBanner
                  dataAdSlot="5459821520"
                  uniqueId={`adbanner-article-${containerIndex + 5}`}
                />
                <AdBanner
                  dataAdSlot="5459821520"
                  uniqueId={`adbanner-article-${containerIndex + 6}`}
                  className="hidden md:block"
                />
                <AdBanner
                  dataAdSlot="5459821520"
                  uniqueId={`adbanner-article-${containerIndex + 7}`}
                  className="hidden md:block"
                />
                <AdBanner
                  dataAdSlot="5459821520"
                  uniqueId={`adbanner-article-${containerIndex + 8}`}
                  className="hidden lg:block"
                />
              </div>
            )}

            {/* Container Content */}
            <div className="px-8 md:px-16 space-y-8 md:space-y-16">
              {container.content && container.content.length > 0 ? (
                container.content.map((section, sectionIndex) => {
                  // Calculate global section index: sum of sections in previous containers + current sectionIndex
                  const previousSectionsCount = containers
                    .slice(0, containerIndex)
                    .reduce((sum, c) => sum + (c.content?.length || 0), 0);
                  const globalSectionIndex =
                    previousSectionsCount + sectionIndex;

                  return (
                    <section
                      key={sectionIndex}
                      className="flex flex-col gap-8 md:gap-16"
                    >
                      <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 text-center">
                        {section?.subTitle || "Untitled Section"}
                      </h2>
                      <div className="space-y-4 md:space-y-8">
                        {section?.articleParagraphs &&
                        section.articleParagraphs.length > 0 ? (
                          section.articleParagraphs.map((paragraph, pIndex) => (
                            <p
                              key={pIndex}
                              className="text-gray-700 text-lg leading-relaxed"
                            >
                              {paragraph}
                            </p>
                          ))
                        ) : (
                          <p className="text-gray-500 italic">
                            No content available for this section.
                          </p>
                        )}
                      </div>

                      {/* Products Banner */}
                      <ProductsBanner
                        size="970x240"
                        affiliateCompany="amazon"
                        category={
                          articleData?.category
                            ? translateCategoryToLocale(
                                articleData.category,
                                locale
                              )
                            : undefined
                        }
                        product={
                          articleData?.languages?.[0]?.salesProducts?.[
                            globalSectionIndex
                          ] || ""
                        }
                      />

                      {/* AdBanner */}
                      <AdBanner
                        dataAdSlot="4003409246"
                        uniqueId="adbanner-article-999"
                        className="hidden lg:block"
                      />
                    </section>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 italic">
                    No content available for this article.
                  </p>
                </div>
              )}
            </div>
          </div>
          {/* Social Media Section at the end of the second container */}
          {containerIndex === 1 && <SocialMedia />}
        </div>
      ))}

      {/* Like Button at Bottom */}
      <div className="flex justify-center items-center">
        {/* Like Button at Bottom */}
        <Button
          onClick={toggleLike}
          className={`cursor-pointer bg-transparent border-none hover:bg-transparent hover:scale-110 transition-all duration-200 shadow-none ${
            isLiked ? "text-red-600" : "text-gray-200"
          }`}
        >
          <Heart
            className={`size-8 ${
              isLiked
                ? "fill-red-600 stroke-white stroke-[1.5]"
                : "stroke-current fill-none"
            }`}
          />
        </Button>
      </div>
    </div>
  );
}
