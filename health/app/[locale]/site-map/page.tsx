import { Metadata } from "next";
import dynamic from "next/dynamic";
import ErrorBoundary from "@/components/ErrorBoundary";
import { generatePublicMetadata } from "@/lib/utils/genericMetadata";
import { getTranslations } from "next-intl/server";
import SectionHeader from "@/components/server/SectionHeader";
import Link from "next/link";
import { mainCategories } from "@/lib/constants";
import { translateCategoryToLocale } from "@/lib/utils/routeTranslation";
import {
  Home,
  User,
  BookOpen,
  Plus,
  Mail,
  Shield,
  FileText,
  Globe,
  HelpCircle,
} from "lucide-react";
import AdBanner from "@/components/adSence/AdBanner";

// Lazy load below-fold banners (they're not critical for initial render)
const ProductsBanner = dynamic(() => import("@/components/ProductsBanner"));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return generatePublicMetadata(locale, "/site-map", "metadata.siteMap.title");
}

export const revalidate = 3600; // 1 hour

export default async function SiteMapPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "siteMap" });

  return (
    <main className="container mx-auto my-8 md:my-16">
      <ErrorBoundary context={"Site Map component"}>
        <div className="flex flex-col h-full gap-8 md:gap-16">
          {/* Products Banner */}
          <ProductsBanner size="970x90" affiliateCompany="amazon" />

          {/* Hero Section */}
          <SectionHeader title={t("title")} description={t("description")} />

          {/* AdBanner */}
          <AdBanner
            dataAdSlot="4003409246"
            uniqueId="adbanner-site-1"
            className="hidden lg:block"
          />

          {/* Main Navigation Grid */}
          <div className="max-w-6xl mx-auto px-4 md:px-8 space-y-4 md:space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Home & Core Pages */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Home className="w-5 h-5 mr-2 text-red-600" />
                  {t("sections.corePages.title")}
                </h2>
                <ul className="space-y-3">
                  <li>
                    <Link
                      href={`/${locale}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {t("sections.corePages.home")}
                    </Link>
                    <span className="text-gray-500 text-sm ml-2">
                      - {t("sections.corePages.homeDescription")}
                    </span>
                  </li>
                  <li>
                    <Link
                      href={`/${locale}/about`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {t("sections.corePages.about")}
                    </Link>
                    <span className="text-gray-500 text-sm ml-2">
                      - {t("sections.corePages.aboutDescription")}
                    </span>
                  </li>
                  <li>
                    <Link
                      href={`/${locale}/search`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {t("sections.corePages.search")}
                    </Link>
                    <span className="text-gray-500 text-sm ml-2">
                      - {t("sections.corePages.searchDescription")}
                    </span>
                  </li>
                </ul>
              </div>

              {/* Article Categories */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-red-600" />
                  {t("sections.articleCategories.title")}
                </h2>
                <ul className="space-y-3">
                  {mainCategories.map((category) => (
                    <li key={category}>
                      <Link
                        href={`/${locale}/${translateCategoryToLocale(
                          category,
                          locale
                        )}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline capitalize"
                      >
                        {t(`sections.articleCategories.${category}`)}
                      </Link>
                      <span className="text-gray-500 text-sm ml-2">
                        -{" "}
                        {t(`sections.articleCategories.${category}Description`)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* User Account */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-red-600" />
                  {t("sections.userAccount.title")}
                </h2>
                <ul className="space-y-3">
                  <li>
                    <Link
                      href={`/${locale}/signin`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {t("sections.userAccount.signIn")}
                    </Link>
                    <span className="text-gray-500 text-sm ml-2">
                      - {t("sections.userAccount.signInDescription")}
                    </span>
                  </li>
                  <li>
                    <Link
                      href={`/${locale}/signup`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {t("sections.userAccount.signUp")}
                    </Link>
                    <span className="text-gray-500 text-sm ml-2">
                      - {t("sections.userAccount.signUpDescription")}
                    </span>
                  </li>
                  <li>
                    <Link
                      href={`/${locale}/profile`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {t("sections.userAccount.profile")}
                    </Link>
                    <span className="text-gray-500 text-sm ml-2">
                      - {t("sections.userAccount.profileDescription")}
                    </span>
                  </li>
                  <li>
                    <Link
                      href={`/${locale}/dashboard`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {t("sections.userAccount.dashboard")}
                    </Link>
                    <span className="text-gray-500 text-sm ml-2">
                      - {t("sections.userAccount.dashboardDescription")}
                    </span>
                  </li>
                  <li>
                    <Link
                      href={`/${locale}/favorites`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {t("sections.userAccount.favorites")}
                    </Link>
                    <span className="text-gray-500 text-sm ml-2">
                      - {t("sections.userAccount.favoritesDescription")}
                    </span>
                  </li>
                </ul>
              </div>

              {/* Content Creation */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Plus className="w-5 h-5 mr-2 text-red-600" />
                  {t("sections.contentCreation.title")}
                </h2>
                <ul className="space-y-3">
                  <li>
                    <Link
                      href={`/${locale}/create-article`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {t("sections.contentCreation.createArticle")}
                    </Link>
                    <span className="text-gray-500 text-sm ml-2">
                      - {t("sections.contentCreation.createArticleDescription")}
                    </span>
                  </li>
                </ul>
              </div>

              {/* Newsletter & Communication */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Mail className="w-5 h-5 mr-2 text-red-600" />
                  {t("sections.newsletter.title")}
                </h2>
                <ul className="space-y-3">
                  <li>
                    <Link
                      href={`/${locale}/confirm-newsletter`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {t("sections.newsletter.confirmNewsletter")}
                    </Link>
                    <span className="text-gray-500 text-sm ml-2">
                      - {t("sections.newsletter.confirmNewsletterDescription")}
                    </span>
                  </li>
                  <li>
                    <Link
                      href={`/${locale}/unsubscribe`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {t("sections.newsletter.unsubscribe")}
                    </Link>
                    <span className="text-gray-500 text-sm ml-2">
                      - {t("sections.newsletter.unsubscribeDescription")}
                    </span>
                  </li>
                </ul>
              </div>

              {/* Security & Account Management */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-red-600" />
                  {t("sections.security.title")}
                </h2>
                <ul className="space-y-3">
                  <li>
                    <Link
                      href={`/${locale}/forgot-password`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {t("sections.security.forgotPassword")}
                    </Link>
                    <span className="text-gray-500 text-sm ml-2">
                      - {t("sections.security.forgotPasswordDescription")}
                    </span>
                  </li>
                  <li>
                    <Link
                      href={`/${locale}/reset-password`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {t("sections.security.resetPassword")}
                    </Link>
                    <span className="text-gray-500 text-sm ml-2">
                      - {t("sections.security.resetPasswordDescription")}
                    </span>
                  </li>
                  <li>
                    <Link
                      href={`/${locale}/confirm-email`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {t("sections.security.confirmEmail")}
                    </Link>
                    <span className="text-gray-500 text-sm ml-2">
                      - {t("sections.security.confirmEmailDescription")}
                    </span>
                  </li>
                </ul>
              </div>

              {/* Legal & Policies */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-red-600" />
                  {t("sections.legal.title")}
                </h2>
                <ul className="space-y-3">
                  <li>
                    <Link
                      href={`/${locale}/privacy-policy`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {t("sections.legal.privacyPolicy")}
                    </Link>
                    <span className="text-gray-500 text-sm ml-2">
                      - {t("sections.legal.privacyPolicyDescription")}
                    </span>
                  </li>
                  <li>
                    <Link
                      href={`/${locale}/terms-conditions`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {t("sections.legal.termsConditions")}
                    </Link>
                    <span className="text-gray-500 text-sm ml-2">
                      - {t("sections.legal.termsConditionsDescription")}
                    </span>
                  </li>
                  <li>
                    <Link
                      href={`/${locale}/cookie-policy`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {t("sections.legal.cookiePolicy")}
                    </Link>
                    <span className="text-gray-500 text-sm ml-2">
                      - {t("sections.legal.cookiePolicyDescription")}
                    </span>
                  </li>
                </ul>
              </div>

              {/* Language Support */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Globe className="w-5 h-5 mr-2 text-red-600" />
                  {t("sections.languageSupport.title")}
                </h2>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 mb-3">
                    {t("sections.languageSupport.description")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-gradient-left-right text-white text-xs rounded">
                      {t("sections.languageSupport.english")}
                    </span>
                    <span className="px-2 py-1 bg-gradient-left-right text-white text-xs rounded">
                      {t("sections.languageSupport.portuguese")}
                    </span>
                    <span className="px-2 py-1 bg-gradient-left-right text-white text-xs rounded">
                      {t("sections.languageSupport.spanish")}
                    </span>
                    <span className="px-2 py-1 bg-gradient-left-right text-white text-xs rounded">
                      {t("sections.languageSupport.french")}
                    </span>
                    <span className="px-2 py-1 bg-gradient-left-right text-white text-xs rounded">
                      {t("sections.languageSupport.german")}
                    </span>
                    <span className="px-2 py-1 bg-gradient-left-right text-white text-xs rounded">
                      {t("sections.languageSupport.italian")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Help & Support */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <HelpCircle className="w-5 h-5 mr-2 text-red-600" />
                  {t("sections.helpSupport.title")}
                </h2>
                <ul className="space-y-3">
                  <li>
                    <Link
                      href={`/${locale}/site-map`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {t("sections.helpSupport.siteMap")}
                    </Link>
                    <span className="text-gray-500 text-sm ml-2">
                      - {t("sections.helpSupport.siteMapDescription")}
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Footer Note */}
            <div className="text-center text-gray-500 text-sm">
              <p>{t("footer.description")}</p>
            </div>
          </div>

          {/* Bottom banner */}
          <ProductsBanner size="970x240" affiliateCompany="amazon" />

          {/* AdBanner */}
          <div className="flex justify-center gap-6">
            <AdBanner dataAdSlot="5459821520" uniqueId="adbanner-site-2" />
            <AdBanner
              dataAdSlot="5459821520"
              uniqueId="adbanner-site-3"
              className="hidden md:block"
            />
            <AdBanner
              dataAdSlot="5459821520"
              uniqueId="adbanner-site-4"
              className="hidden md:block"
            />
            <AdBanner
              dataAdSlot="5459821520"
              uniqueId="adbanner-site-5"
              className="hidden lg:block"
            />
          </div>
        </div>
      </ErrorBoundary>
    </main>
  );
}
