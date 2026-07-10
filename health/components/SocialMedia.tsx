"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { SocialIcon } from "react-social-icons";
import { socialMedia } from "@/lib/constants";

interface SocialMediaProps {
  /** Text alignment for the component */
  align?: "left" | "center" | "right";
  /** Size of the social icons */
  iconSize?: number;
  /** Custom className for the container */
  className?: string;
  /** Variant style: 'default' for full section, 'compact' for inline use */
  variant?: "default" | "compact";
}

const SocialMedia = ({
  align = "center",
  iconSize = 40,
  className = "",
  variant = "default",
}: SocialMediaProps) => {
  const locale = useLocale();
  const t = useTranslations("socialMedia");

  // Get locale-specific social media URLs and English fallback
  const localeSocialUrls =
    socialMedia.language[locale as keyof typeof socialMedia.language] ||
    socialMedia.language.en;
  const enSocialUrls = socialMedia.language.en;

  // Helper function to get social URL with fallback to English
  const getSocialUrl = (platform: keyof typeof enSocialUrls): string => {
    if (
      platform in localeSocialUrls &&
      localeSocialUrls[platform as keyof typeof localeSocialUrls]
    ) {
      return localeSocialUrls[
        platform as keyof typeof localeSocialUrls
      ] as string;
    }
    return enSocialUrls[platform];
  };

  // Alignment classes
  const alignClasses = {
    left: "items-start text-left",
    center: "items-center text-center",
    right: "items-end text-right",
  };

  const iconContainerClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  };

  // Social icons component (reusable)
  const SocialIcons = () => (
    <>
      <SocialIcon
        url={getSocialUrl("instagram")}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:scale-110 transition-transform duration-200"
        bgColor="transparent"
        style={{ width: iconSize, height: iconSize }}
      />
      <SocialIcon
        url={getSocialUrl("twitter")}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:scale-110 transition-transform duration-200"
        bgColor="transparent"
        style={{ width: iconSize, height: iconSize }}
      />
      <SocialIcon
        url={getSocialUrl("pinterest")}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:scale-110 transition-transform duration-200"
        bgColor="transparent"
        style={{ width: iconSize, height: iconSize }}
      />
      <SocialIcon
        url={getSocialUrl("tiktok")}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:scale-110 transition-transform duration-200"
        bgColor="transparent"
        style={{ width: iconSize, height: iconSize }}
      />
      <SocialIcon
        network="threads"
        url={getSocialUrl("threads")}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:scale-110 transition-transform duration-200"
        bgColor="transparent"
        style={{ width: iconSize, height: iconSize }}
      />
      <SocialIcon
        url={getSocialUrl("facebook")}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:scale-110 transition-transform duration-200"
        bgColor="transparent"
        style={{ width: iconSize, height: iconSize }}
      />
    </>
  );

  // Default variant: Full section with gradient background (like SectionHeader)
  if (variant === "default") {
    return (
      <section className={`bg-gradient-left-right py-8 md:py-12 ${className}`}>
        <div className="container mx-auto px-4">
          <div className={`flex flex-col space-y-4 ${alignClasses[align]}`}>
            <h3
              className="text-2xl md:text-3xl font-bold text-white cursor-default font-[Open_Sans]"
              style={{
                textShadow:
                  "2px 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.4)",
              }}
            >
              {t("followUs")}
            </h3>
            <p className="text-base md:text-lg text-white max-w-2xl mx-auto">
              {t("catchMessage")}
            </p>
            <div
              className={`flex flex-wrap gap-4 ${iconContainerClasses[align]} pt-2`}
            >
              <SocialIcons />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Compact variant: For inline use (like in article pages) - keeps gradient background
  return (
    <div
      className={`bg-gradient-left-right py-6 md:py-8 ${alignClasses[align]} ${className}`}
    >
      <div className="px-4 md:px-6">
        <h3
          className="text-lg md:text-xl font-bold text-white cursor-default font-[Open_Sans] mb-2"
          style={{
            textShadow:
              "2px 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.4)",
          }}
        >
          {t("followUs")}
        </h3>
        <div
          className={`flex flex-wrap gap-3 ${iconContainerClasses[align]} mb-2`}
        >
          <SocialIcons />
        </div>
        <p className="text-sm md:text-base text-white cursor-default">
          {t("catchMessage")}
        </p>
      </div>
    </div>
  );
};

export default SocialMedia;
