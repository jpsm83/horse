import { Metadata } from "next";
import dynamic from "next/dynamic";
import ErrorBoundary from "@/components/ErrorBoundary";
import { generatePublicMetadata } from "@/lib/utils/genericMetadata";
import { getTranslations } from "next-intl/server";
import SectionHeader from "@/components/server/SectionHeader";
import AdBanner from "@/components/adSence/AdBanner";

// Lazy load below-fold banners (they're not critical for initial render)
const ProductsBanner = dynamic(() => import("@/components/ProductsBanner"));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return generatePublicMetadata(
    locale,
    "/cookie-policy",
    "metadata.cookiePolicy.title"
  );
}

export const revalidate = 3600; // 1 hour

export default async function CookiePolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cookiePolicy" });

  return (
    <main className="container mx-auto my-8 md:my-16">
      <ErrorBoundary context={"Cookie Policy component"}>
        <div className="flex flex-col h-full gap-8 md:gap-16">
          {/* Products Banner */}
          <ProductsBanner size="970x90" affiliateCompany="amazon" />

          {/* Hero Section */}
          <SectionHeader
            title={t("hero.title")}
            description={t("hero.subtitle")}
          />

          {/* AdBanner */}
          <AdBanner
            dataAdSlot="4003409246"
            uniqueId="adbanner-cookie-1"
            className="hidden lg:block"
          />

          {/* Introduction Section */}
          <div className="max-w-6xl mx-auto px-4 md:px-8 space-y-4 md:space-y-8">
            <p className="text-lg text-gray-700">
              {t("introduction.paragraph1")}
            </p>
            <p className="text-lg text-gray-700">
              {t("introduction.paragraph2")}
            </p>
          </div>

          {/* Content Sections */}
          <div className="max-w-6xl mx-auto px-4 md:px-8 space-y-8 md:space-y-16">
            <section>
              <h2 className="text-2xl font-semibold mb-4 md:mb-8">
                {t("sections.whatAreCookies.title")}
              </h2>
              <p className="mb-4">
                {t("sections.whatAreCookies.paragraphs.0")}
              </p>
              <p className="mb-4">
                {t("sections.whatAreCookies.paragraphs.1")}
              </p>
              <p className="mb-4">
                {t("sections.whatAreCookies.paragraphs.2")}
              </p>
              <p>{t("sections.whatAreCookies.paragraphs.3")}</p>
            </section>

            {/* Products Banner */}
            <ProductsBanner size="970x240" affiliateCompany="amazon" />

            <section>
              <h2 className="text-2xl font-semibold mb-4 md:mb-8">
                {t("sections.whichCookies.title")}
              </h2>
              <p className="mb-4">{t("sections.whichCookies.description")}</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 md:mb-8">
                {t("sections.yourChoices.title")}
              </h2>
              <p className="mb-4">{t("sections.yourChoices.paragraphs.0")}</p>
              <p className="mb-4">{t("sections.yourChoices.paragraphs.1")}</p>

              {/* AdBanner */}
              <div className="flex justify-center gap-6 my-6 md:my-12">
                <AdBanner
                  dataAdSlot="5459821520"
                  uniqueId="adbanner-cookie-2"
                />
                <AdBanner
                  dataAdSlot="5459821520"
                  uniqueId="adbanner-cookie-3"
                  className="hidden md:block"
                />
                <AdBanner
                  dataAdSlot="5459821520"
                  uniqueId="adbanner-cookie-4"
                  className="hidden md:block"
                />
                <AdBanner
                  dataAdSlot="5459821520"
                  uniqueId="adbanner-cookie-5"
                  className="hidden lg:block"
                />
              </div>

              <div className="space-y-4 md:space-y-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4 md:mb-6">
                    {t("sections.yourChoices.subsections.websiteOptOut.title")}
                  </h3>
                  <p className="mb-4">
                    {t(
                      "sections.yourChoices.subsections.websiteOptOut.paragraphs.0"
                    )}
                  </p>
                  <p className="mb-4">
                    {t(
                      "sections.yourChoices.subsections.websiteOptOut.paragraphs.1"
                    )}
                  </p>
                  <p>
                    {t(
                      "sections.yourChoices.subsections.websiteOptOut.paragraphs.2"
                    )}
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4 md:mb-6">
                    {t(
                      "sections.yourChoices.subsections.mobileAppOptOut.title"
                    )}
                  </h3>
                  <p className="mb-4">
                    {t(
                      "sections.yourChoices.subsections.mobileAppOptOut.paragraphs.0"
                    )}
                  </p>
                  <p>
                    {t(
                      "sections.yourChoices.subsections.mobileAppOptOut.paragraphs.1"
                    )}
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4 md:mb-6">
                    {t(
                      "sections.yourChoices.subsections.moreInformation.title"
                    )}
                  </h3>
                  <p>
                    {t(
                      "sections.yourChoices.subsections.moreInformation.description"
                    )}
                    <a
                      href="https://www.allaboutcookies.org"
                      className="main-link"
                    >
                      {t(
                        "sections.yourChoices.subsections.moreInformation.links.allaboutcookies"
                      )}
                    </a>{" "}
                    and{" "}
                    <a
                      href="https://www.youronlinechoices.eu"
                      className="main-link"
                    >
                      {t(
                        "sections.yourChoices.subsections.moreInformation.links.youronlinechoices"
                      )}
                    </a>
                    .
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Bottom banner */}
          <ProductsBanner size="970x240" affiliateCompany="amazon" />

          {/* AdBanner */}
          <div className="flex justify-center gap-6">
            <AdBanner dataAdSlot="5459821520" uniqueId="adbanner-cookie-6" />
            <AdBanner
              dataAdSlot="5459821520"
              uniqueId="adbanner-cookie-7"
              className="hidden md:block"
            />
            <AdBanner
              dataAdSlot="5459821520"
              uniqueId="adbanner-cookie-8"
              className="hidden md:block"
            />
            <AdBanner
              dataAdSlot="5459821520"
              uniqueId="adbanner-cookie-9"
              className="hidden lg:block"
            />
          </div>
        </div>
      </ErrorBoundary>
    </main>
  );
}
