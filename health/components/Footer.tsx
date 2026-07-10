"use client";

import React from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Heart } from "lucide-react";
import { SocialIcon } from "react-social-icons";
import { socialMedia } from "@/lib/constants";

const Footer = () => {
  const locale = useLocale();
  const t = useTranslations("footer");
  
  // Get locale-specific social media URLs and English fallback
  const localeSocialUrls = socialMedia.language[locale as keyof typeof socialMedia.language] || socialMedia.language.en;
  const enSocialUrls = socialMedia.language.en;
  
  // Helper function to get social URL with fallback to English
  const getSocialUrl = (platform: keyof typeof enSocialUrls): string => {
    if (platform in localeSocialUrls && localeSocialUrls[platform as keyof typeof localeSocialUrls]) {
      return localeSocialUrls[platform as keyof typeof localeSocialUrls] as string;
    }
    return enSocialUrls[platform];
  };

  return (
    <footer className="bg-gradient-left-right text-white shadow-lg">
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row lg:flex-row gap-8 md:gap-16 justify-center items-center md:items-start flex-wrap">
          {/* Brand section */}
          <div className="flex flex-col items-center md:items-start md:text-left text-center space-y-4 shrink-0 min-w-[250px] md:min-w-[280px]">
            <Link href={`/${locale}`} className="flex items-center space-x-2">
              <Heart size={24} className="text-white" />
              <span className="text-xl font-bold" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.4)'}}>Women&apos;s Spot</span>
            </Link>
            <p className="text-white text-sm text-center md:text-left max-w-xs cursor-default">
              {t("brandDescription")}
            </p>
          </div>

          {/* Quick links section */}
          <div className="flex flex-col items-center md:items-start md:text-left text-center space-y-4 shrink-0 min-w-[200px] md:min-w-[220px]">
            <h3 className="text-lg font-semibold text-white cursor-default">
              {t("quickLinks")}
            </h3>
            <div className="flex flex-col space-y-2">
              <Link
                href={`/${locale}/about`}
                className="text-gray-200 hover:text-white transition-colors duration-200 text-sm"
              >
                {t("aboutUs")}
              </Link>
              <Link
                href={`/${locale}/privacy-policy`}
                className="text-gray-200 hover:text-white transition-colors duration-200 text-sm"
              >
                {t("privacyPolicy")}
              </Link>
              <Link
                href={`/${locale}/terms-conditions`}
                className="text-gray-200 hover:text-white transition-colors duration-200 text-sm"
              >
                {t("termsAndConditions")}
              </Link>
              <Link
                href={`/${locale}/cookie-policy`}
                className="text-gray-200 hover:text-white transition-colors duration-200 text-sm"
              >
                {t("cookiesPolicy")}
              </Link>
              <Link
                href={`/${locale}/site-map`}
                className="text-gray-200 hover:text-white transition-colors duration-200 text-sm"
              >
                {t("siteMap")}
              </Link>
            </div>
          </div>

          {/* Social media section */}
          <div className="flex flex-col items-center md:items-start space-y-4 shrink-0 min-w-[200px] md:min-w-[220px]">
            <h3 className="text-lg font-semibold text-white cursor-default">
              {t("followUs")}
            </h3>
            <div className="flex flex-wrap gap-3">
              <SocialIcon
                url={getSocialUrl("instagram")}
                target="_blank"
                className="hover:scale-110 transition-transform duration-200"
                bgColor="transparent"
                style={{ width: 40, height: 40 }}
              />
              <SocialIcon
                url={getSocialUrl("twitter")}
                target="_blank"
                className="hover:scale-110 transition-transform duration-200"
                bgColor="transparent"
                style={{ width: 40, height: 40 }}
              />
              <SocialIcon
                url={getSocialUrl("pinterest")}
                target="_blank"
                className="hover:scale-110 transition-transform duration-200"
                bgColor="transparent"
                style={{ width: 40, height: 40 }}
              />
              <SocialIcon
                url={getSocialUrl("tiktok")}
                target="_blank"
                className="hover:scale-110 transition-transform duration-200"
                bgColor="transparent"
                style={{ width: 40, height: 40 }}
              />
              <SocialIcon
                network="threads"
                url={getSocialUrl("threads")}
                target="_blank"
                className="hover:scale-110 transition-transform duration-200"
                bgColor="transparent"
                style={{ width: 40, height: 40 }}
              />
              <SocialIcon
                url={getSocialUrl("facebook")}
                target="_blank"
                className="hover:scale-110 transition-transform duration-200"
                bgColor="transparent"
                style={{ width: 40, height: 40 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom footer bar */}
      <div className="bg-black/20 w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 border-t border-white flex justify-center items-center">
        <p className="text-white text-sm text-center md:text-left">
          {t("copyright")}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
