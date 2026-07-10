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
    "/terms-conditions",
    "metadata.termsConditions.title"
  );
}

export const revalidate = 3600; // 1 hour

export default async function TermsConditionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "termsConditions" });

  return (
    <main className="container mx-auto my-8 md:my-16">
      <ErrorBoundary context={"Terms and Conditions component"}>
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
            uniqueId="adbanner-conditions-1"
            className="hidden lg:block"
          />

          {/* Terms of Use Section */}
          <div className="max-w-6xl mx-auto px-4 md:px-8 space-y-4 md:space-y-8">
            <div className="bg-purple-50 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 md:mb-8">
                {t("termsOfUse.title")}
              </h2>
              <p className="mb-4">{t("termsOfUse.description")}</p>
              <ul className="list-disc pl-6 space-y-2 md:space-y-4">
                <li>
                  <strong>{t("termsOfUse.definitions.0.term")}</strong>{" "}
                  {t("termsOfUse.definitions.0.definition")}
                </li>
                <li>
                  <strong>{t("termsOfUse.definitions.1.term")}</strong>{" "}
                  {t("termsOfUse.definitions.1.definition")}
                </li>
                <li>
                  <strong>{t("termsOfUse.definitions.2.term")}</strong>{" "}
                  {t("termsOfUse.definitions.2.definition")}
                </li>
                <li>
                  <strong>{t("termsOfUse.definitions.3.term")}</strong>{" "}
                  {t("termsOfUse.definitions.3.definition")}
                </li>
              </ul>
            </div>
          </div>

          {/* Products Banner */}
          <ProductsBanner size="970x240" affiliateCompany="amazon" />

          {/* Content Sections */}
          <div className="max-w-6xl mx-auto px-4 md:px-8 space-y-8 md:space-y-16">
            <section>
              <h2 className="text-2xl font-semibold mb-4 md:mb-8">
                {t("sections.introduction.title")}
              </h2>
              <ol className="list-decimal pl-6 space-y-2 md:space-y-4">
                <li>{t("sections.introduction.items.0")}</li>
                <li>{t("sections.introduction.items.1")}</li>
                <li>{t("sections.introduction.items.2")}</li>
                <li>{t("sections.introduction.items.3")}</li>
                <li>{t("sections.introduction.items.4")}</li>
                <li>{t("sections.introduction.items.5")}</li>
                <li>{t("sections.introduction.items.6")}</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 md:mb-8">
                {t("sections.useOfSites.title")}
              </h2>
              <ol className="list-decimal pl-6 space-y-2 md:space-y-4">
                <li>{t("sections.useOfSites.items.0")}</li>
                <li>{t("sections.useOfSites.items.1")}</li>
                <li>{t("sections.useOfSites.items.2")}</li>
                <li>{t("sections.useOfSites.items.3")}</li>
                <li>{t("sections.useOfSites.items.4")}</li>
                <li>{t("sections.useOfSites.items.5")}</li>
                <li>{t("sections.useOfSites.items.6")}</li>
                <li>{t("sections.useOfSites.items.7")}</li>
              </ol>
            </section>

            {/* AdBanner */}
            <div className="flex justify-center gap-6">
              <AdBanner
                dataAdSlot="5459821520"
                uniqueId="adbanner-conditions-2"
              />
              <AdBanner
                dataAdSlot="5459821520"
                uniqueId="adbanner-conditions-3"
                className="hidden md:block"
              />
              <AdBanner
                dataAdSlot="5459821520"
                uniqueId="adbanner-conditions-4"
                className="hidden md:block"
              />
              <AdBanner
                dataAdSlot="5459821520"
                uniqueId="adbanner-conditions-5"
                className="hidden lg:block"
              />
            </div>

            <section>
              <h2 className="text-2xl font-semibold mb-4 md:mb-8">
                {t("sections.ageLimit.title")}
              </h2>
              <p>{t("sections.ageLimit.description")}</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 md:mb-8">
                {t("sections.useOfDiscussionForums.title")}
              </h2>
              <ol className="list-decimal pl-6 space-y-2 md:space-y-4">
                <li>{t("sections.useOfDiscussionForums.items.0")}</li>
                <li>{t("sections.useOfDiscussionForums.items.1")}</li>
                <li>{t("sections.useOfDiscussionForums.items.2")}</li>
                <li>{t("sections.useOfDiscussionForums.items.3")}</li>
                <li>{t("sections.useOfDiscussionForums.items.4")}</li>
                <li>{t("sections.useOfDiscussionForums.items.5")}</li>
                <li>{t("sections.useOfDiscussionForums.items.6")}</li>
                <li>{t("sections.useOfDiscussionForums.items.7")}</li>
                <li>{t("sections.useOfDiscussionForums.items.8")}</li>
                <li>{t("sections.useOfDiscussionForums.items.9")}</li>
                <li>{t("sections.useOfDiscussionForums.items.10")}</li>
              </ol>
            </section>

            {/* Products Banner */}
            <ProductsBanner size="970x240" affiliateCompany="amazon" />

            <section>
              <h2 className="text-2xl font-semibold mb-4 md:mb-8">
                {t("sections.useOfMaterialPosted.title")}
              </h2>
              <p className="mb-4">
                {t("sections.useOfMaterialPosted.description")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 md:mb-8">
                {t("sections.privacy.title")}
              </h2>
              <p>{t("sections.privacy.description")}</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 md:mb-8">
                {t("sections.safety.title")}
              </h2>
              <p>{t("sections.safety.description")}</p>
            </section>

            {/* AdBanner */}
            <div className="flex justify-center gap-6">
              <AdBanner
                dataAdSlot="5459821520"
                uniqueId="adbanner-conditions-6"
              />
              <AdBanner
                dataAdSlot="5459821520"
                uniqueId="adbanner-conditions-7"
                className="hidden md:block"
              />
              <AdBanner
                dataAdSlot="5459821520"
                uniqueId="adbanner-conditions-8"
                className="hidden md:block"
              />
              <AdBanner
                dataAdSlot="5459821520"
                uniqueId="adbanner-conditions-9"
                className="hidden lg:block"
              />
            </div>

            <section>
              <h2 className="text-2xl font-semibold mb-4 md:mb-8">
                {t("sections.informationAndAvailability.title")}
              </h2>
              <p className="mb-4">
                {t("sections.informationAndAvailability.items.0")}
              </p>
              <p>{t("sections.informationAndAvailability.items.1")}</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 md:mb-8">
                {t("sections.links.title")}
              </h2>
              <ol className="list-decimal pl-6 space-y-2 md:space-y-4">
                <li>{t("sections.links.items.0")}</li>
                <li>{t("sections.links.items.1")}</li>
                <li>{t("sections.links.items.2")}</li>
                <li>{t("sections.links.items.3")}</li>
              </ol>
            </section>

            {/* AdBanner */}
            <AdBanner
              dataAdSlot="4003409246"
              uniqueId="adbanner-conditions-10"
              className="hidden lg:block"
            />

            <section>
              <h2 className="text-2xl font-semibold mb-4 md:mb-8">
                {t("sections.general.title")}
              </h2>
              <ol className="list-decimal pl-6 space-y-2 md:space-y-4">
                <li>{t("sections.general.items.0")}</li>
                <li>{t("sections.general.items.1")}</li>
                <li>{t("sections.general.items.2")}</li>
                <li>{t("sections.general.items.3")}</li>
                <li>{t("sections.general.items.4")}</li>
                <li>{t("sections.general.items.5")}</li>
                <li>{t("sections.general.items.6")}</li>
              </ol>
            </section>

            <div className="bg-red-50 border-red-600 border-2 p-4 rounded-lg">
              <p className="text-red-600 font-semibold text-center">
                {t("warning.message")}
              </p>
            </div>
          </div>

          {/* Bottom banner */}
          <ProductsBanner size="970x240" affiliateCompany="amazon" />

          {/* AdBanner */}
          <div className="flex justify-center gap-6">
            <AdBanner
              dataAdSlot="5459821520"
              uniqueId="adbanner-conditions-11"
            />
            <AdBanner
              dataAdSlot="5459821520"
              uniqueId="adbanner-conditions-12"
              className="hidden md:block"
            />
            <AdBanner
              dataAdSlot="5459821520"
              uniqueId="adbanner-conditions-13"
              className="hidden md:block"
            />
            <AdBanner
              dataAdSlot="5459821520"
              uniqueId="adbanner-conditions-14"
              className="hidden lg:block"
            />
          </div>
        </div>
      </ErrorBoundary>
    </main>
  );
}
