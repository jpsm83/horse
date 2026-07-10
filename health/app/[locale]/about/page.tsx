import { Metadata } from "next";
import dynamic from "next/dynamic";
import ErrorBoundary from "@/components/ErrorBoundary";
import { generatePublicMetadata } from "@/lib/utils/genericMetadata";
import { getTranslations } from "next-intl/server";
import SectionHeader from "@/components/server/SectionHeader";
import AboutCategoriesSection from "@/components/AboutCategoriesSection";
import AboutCallToActionSection from "@/components/AboutCallToActionSection";
import AdBanner from "@/components/adSence/AdBanner";

// Lazy load below-fold banners (they're not critical for initial render)
const ProductsBanner = dynamic(() => import("@/components/ProductsBanner"));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return generatePublicMetadata(locale, "/about", "metadata.about.title");
}

export const revalidate = 3600; // 1 hour

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });

  const categories = [
    {
      key: "healthWellness",
      iconName: "Heart",
    },
    {
      key: "fitnessBeauty",
      iconName: "Zap",
    },
    {
      key: "intimacy",
      iconName: "HeartHandshake",
    },
    {
      key: "weight-loss",
      iconName: "Activity",
    },
    {
      key: "life",
      iconName: "Sparkles",
    },
  ];

  return (
    <main className="container mx-auto my-8 md:my-16">
      <ErrorBoundary context={"About component"}>
        <div className="flex flex-col h-full gap-8 md:gap-16">
          {/* Products Banner */}
          <ProductsBanner size="970x90" affiliateCompany="amazon" />

          {/* Hero Section */}
          <SectionHeader
            title={t("hero.title")}
            description={t("hero.subtitle")}
          />

          {/* Mission Section */}
          <div className="max-w-6xl mx-auto px-4 md:px-8 space-y-4 md:space-y-8">
            <h2 className="text-3xl font-bold text-gray-900">
              {t("mission.title")}
            </h2>
            <p className="text-lg text-gray-700">{t("mission.description1")}</p>
            <p className="text-lg text-gray-700">{t("mission.description2")}</p>
          </div>

          {/* AdBanner */}
          <div className="flex justify-center gap-6">
            <AdBanner dataAdSlot="5459821520" uniqueId="adbanner-about-1" />
            <AdBanner
              dataAdSlot="5459821520"
              uniqueId="adbanner-about-2"
              className="hidden md:block"
            />
            <AdBanner
              dataAdSlot="5459821520"
              uniqueId="adbanner-about-3"
              className="hidden md:block"
            />
            <AdBanner
              dataAdSlot="5459821520"
              uniqueId="adbanner-about-4"
              className="hidden lg:block"
            />
          </div>

          {/* What We Do Section */}
          <div className="max-w-6xl mx-auto px-4 md:px-8 space-y-4 md:space-y-8">
            <h2 className="text-3xl font-bold text-gray-900">
              {t("whatWeDo.title")}
            </h2>
            <div className="grid md:grid-cols-2 gap-4 md:gap-8">
              <div className="bg-gray-50 p-4 md:p-8 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-gray-900">
                  {t("whatWeDo.cutThroughNoise.title")}
                </h3>
                <p className="text-gray-700">
                  {t("whatWeDo.cutThroughNoise.description")}
                </p>
              </div>
              <div className="bg-gray-50 p-4 md:p-8 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-gray-900">
                  {t("whatWeDo.personalizedApproach.title")}
                </h3>
                <p className="text-gray-700">
                  {t("whatWeDo.personalizedApproach.description")}
                </p>
              </div>
            </div>
          </div>

          {/* Products Banner */}
          <ProductsBanner size="970x240" affiliateCompany="amazon" />

          {/* Team Section */}
          <div className="max-w-6xl mx-auto px-4 md:px-8 space-y-4 md:space-y-8">
            <h2 className="text-3xl font-bold text-gray-900">
              {t("team.title")}
            </h2>
            <p className="text-lg text-gray-700">{t("team.description1")}</p>
            <p className="text-lg text-gray-700">{t("team.description2")}</p>
            <p className="text-lg text-gray-700">{t("team.description3")}</p>
          </div>

          {/* AdBanner */}
          <AdBanner
            dataAdSlot="4003409246"
            uniqueId="adbanner-about-5"
            className="hidden lg:block"
          />

          {/* Categories Section */}
          <div className="max-w-6xl mx-auto px-4 md:px-8 space-y-4 md:space-y-8">
            <h2 className="text-3xl font-bold text-gray-900">
              {t("whatWeCover.title")}
            </h2>
            <AboutCategoriesSection categories={categories} />
          </div>

          {/* Products Banner */}
          <ProductsBanner size="970x240" affiliateCompany="amazon" />

          {/* Editorial Standards Section */}
          <div className="max-w-6xl mx-auto px-4 md:px-8 space-y-4 md:space-y-8">
            <h2 className="text-3xl font-bold text-gray-900">
              {t("editorialStandards.title")}
            </h2>
            <div className="space-y-4 md:space-y-6">
              <div className="border-l-4 border-purple-500 p-4 md:p-6 shadow-md">
                <h3 className="text-xl font-semibold text-gray-900">
                  {t("editorialStandards.accuracy.title")}
                </h3>
                <p className="text-gray-700">
                  {t("editorialStandards.accuracy.description")}
                </p>
              </div>
              <div className="border-l-4 border-purple-500 p-4 md:p-6 shadow-md">
                <h3 className="text-xl font-semibold text-gray-900">
                  {t("editorialStandards.editorialIndependence.title")}
                </h3>
                <p className="text-gray-700">
                  {t("editorialStandards.editorialIndependence.description")}
                </p>
              </div>
              <div className="border-l-4 border-purple-500 p-4 md:p-6 shadow-md">
                <h3 className="text-xl font-semibold text-gray-900">
                  {t("editorialStandards.privacy.title")}
                </h3>
                <p className="text-gray-700">
                  {t("editorialStandards.privacy.description")}
                </p>
              </div>
            </div>
          </div>

          {/* AdBanner */}
          <AdBanner
            dataAdSlot="4003409246"
            uniqueId="adbanner-about-6"
            className="hidden lg:block"
          />

          {/* Call to Action Section */}
          <AboutCallToActionSection
            locale={locale}
            title={t("callToAction.title")}
            description={t("callToAction.description")}
            button={t("callToAction.button")}
          />

          {/* Bottom banner - lazy loaded */}
          <ProductsBanner size="970x240" affiliateCompany="amazon" />

          {/* AdBanner */}
          <div className="flex justify-center gap-6">
            <AdBanner dataAdSlot="5459821520" uniqueId="adbanner-about-7" />
            <AdBanner
              dataAdSlot="5459821520"
              uniqueId="adbanner-about-8"
              className="hidden md:block"
            />
            <AdBanner
              dataAdSlot="5459821520"
              uniqueId="adbanner-about-9"
              className="hidden md:block"
            />
            <AdBanner
              dataAdSlot="5459821520"
              uniqueId="adbanner-about-10"
              className="hidden lg:block"
            />
          </div>
        </div>
      </ErrorBoundary>
    </main>
  );
}
