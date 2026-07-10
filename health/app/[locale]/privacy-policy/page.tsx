import { Metadata } from "next";
import dynamic from "next/dynamic";
import ErrorBoundary from "@/components/ErrorBoundary";
import { generatePublicMetadata } from "@/lib/utils/genericMetadata";
import { getTranslations } from "next-intl/server";
import SectionHeader from "@/components/server/SectionHeader";
import ClientDate from "@/components/ClientDate";
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
    "/privacy-policy",
    "metadata.privacyPolicy.title"
  );
}

export const revalidate = 3600; // 1 hour

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacyPolicy" });

  return (
    <main className="container mx-auto my-8 md:my-16">
      <ErrorBoundary context={"Privacy Policy component"}>
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
            uniqueId="adbanner-privacy-1"
            className="hidden lg:block"
          />

          {/* Introduction Section */}
          <div className="max-w-6xl mx-auto px-4 md:px-8 space-y-4 md:space-y-8">
            <p className="text-sm text-gray-600">
              {t("lastUpdated")} <ClientDate locale={locale} />
            </p>

            <div className="bg-purple-50 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 md:mb-8">
                {t("highlights.title")}
              </h2>
              <p className="mb-4">{t("highlights.description")}</p>
            </div>
          </div>

          {/* Products Banner */}
          <ProductsBanner size="970x240" affiliateCompany="amazon" />

          {/* Content Sections */}
          <div className="max-w-6xl mx-auto px-4 md:px-8 space-y-8 md:space-y-16">
            <section>
              <h2 className="text-2xl font-semibold mb-4 md:mb-8">
                {t("sections.whatInformationWeObtain.title")}
              </h2>
              <ul className="list-disc pl-6 space-y-2 md:space-y-4">
                <li>{t("sections.whatInformationWeObtain.items.0")}</li>
                <li>{t("sections.whatInformationWeObtain.items.1")}</li>
                <li>{t("sections.whatInformationWeObtain.items.2")}</li>
                <li>{t("sections.whatInformationWeObtain.items.3")}</li>
                <li>{t("sections.whatInformationWeObtain.items.4")}</li>
                <li>{t("sections.whatInformationWeObtain.items.5")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 md:mb-8">
                {t("sections.howWeUseInformation.title")}
              </h2>
              <ul className="list-disc pl-6 space-y-2 md:space-y-4">
                <li>{t("sections.howWeUseInformation.items.0")}</li>
                <li>{t("sections.howWeUseInformation.items.1")}</li>
                <li>{t("sections.howWeUseInformation.items.2")}</li>
                <li>{t("sections.howWeUseInformation.items.3")}</li>
                <li>{t("sections.howWeUseInformation.items.4")}</li>
                <li>{t("sections.howWeUseInformation.items.5")}</li>
              </ul>
            </section>

            {/* AdBanner */}
            <div className="flex justify-center gap-6">
              <AdBanner dataAdSlot="5459821520" uniqueId="adbanner-privacy-2" />
              <AdBanner
                dataAdSlot="5459821520"
                uniqueId="adbanner-privacy-3"
                className="hidden md:block"
              />
              <AdBanner
                dataAdSlot="5459821520"
                uniqueId="adbanner-privacy-4"
                className="hidden md:block"
              />
              <AdBanner
                dataAdSlot="5459821520"
                uniqueId="adbanner-privacy-5"
                className="hidden lg:block"
              />
            </div>

            <section>
              <h2 className="text-2xl font-semibold mb-4 md:mb-8">
                {t("sections.howWeShareInformation.title")}
              </h2>
              <ul className="list-disc pl-6 space-y-2 md:space-y-4">
                <li>{t("sections.howWeShareInformation.items.0")}</li>
                <li>{t("sections.howWeShareInformation.items.1")}</li>
                <li>{t("sections.howWeShareInformation.items.2")}</li>
                <li>{t("sections.howWeShareInformation.items.3")}</li>
                <li>{t("sections.howWeShareInformation.items.4")}</li>
                <li>{t("sections.howWeShareInformation.items.5")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 md:mb-8">
                {t("sections.yourChoices.title")}
              </h2>
              <ul className="list-disc pl-6 space-y-2 md:space-y-4">
                <li>{t("sections.yourChoices.items.0")}</li>
                <li>{t("sections.yourChoices.items.1")}</li>
              </ul>
            </section>

            {/* Products Banner */}
            <ProductsBanner size="970x90" affiliateCompany="amazon" />

            <section>
              <h2 className="text-2xl font-semibold mb-4 md:mb-8">
                {t("sections.additionalInformation.title")}
              </h2>
              <ul className="list-disc pl-6 space-y-2 md:space-y-4">
                <li>{t("sections.additionalInformation.items.0")}</li>
                <li>{t("sections.additionalInformation.items.1")}</li>
                <li>{t("sections.additionalInformation.items.2")}</li>
                <li>{t("sections.additionalInformation.items.3")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 md:mb-8">
                {t("sections.howWeProtectAndStore.title")}
              </h2>
              <p className="mb-4">
                {t("sections.howWeProtectAndStore.description1")}
              </p>
              <p className="mb-4">
                {t("sections.howWeProtectAndStore.description2")}
              </p>
              <ul className="list-disc pl-6 space-y-2 md:space-y-4">
                <li>{t("sections.howWeProtectAndStore.items.0")}</li>
                <li>{t("sections.howWeProtectAndStore.items.1")}</li>
                <li>{t("sections.howWeProtectAndStore.items.2")}</li>
                <li>{t("sections.howWeProtectAndStore.items.3")}</li>
                <li>{t("sections.howWeProtectAndStore.items.4")}</li>
              </ul>
            </section>

            {/* AdBanner */}
            <div className="flex justify-center gap-6">
              <AdBanner dataAdSlot="5459821520" uniqueId="adbanner-privacy-6" />
              <AdBanner
                dataAdSlot="5459821520"
                uniqueId="adbanner-privacy-7"
                className="hidden md:block"
              />
              <AdBanner
                dataAdSlot="5459821520"
                uniqueId="adbanner-privacy-8"
                className="hidden md:block"
              />
              <AdBanner
                dataAdSlot="5459821520"
                uniqueId="adbanner-privacy-9"
                className="hidden lg:block"
              />
            </div>

            <section>
              <h2 className="text-2xl font-semibold mb-4 md:mb-8">
                {t("sections.internationalDataTransfer.title")}
              </h2>
              <p className="mb-4">
                {t("sections.internationalDataTransfer.description1")}
              </p>
              <p>{t("sections.internationalDataTransfer.description2")}</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 md:mb-8">
                {t("sections.childrensPrivacyRights.title")}
              </h2>
              <p>{t("sections.childrensPrivacyRights.description")}</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 md:mb-8">
                {t("sections.linksToThirdParty.title")}
              </h2>
              <p className="mb-4">
                {t("sections.linksToThirdParty.description1")}
              </p>
              <p className="mb-4">
                {t("sections.linksToThirdParty.description2")}
              </p>
              <p>{t("sections.linksToThirdParty.description3")}</p>
            </section>

            {/* AdBanner */}
            <AdBanner
              dataAdSlot="4003409246"
              uniqueId="adbanner-privacy-10"
              className="hidden lg:block"
            />

            <section>
              <h2 className="text-2xl font-semibold mb-4 md:mb-8">
                {t("sections.changesToPrivacyNotice.title")}
              </h2>
              <p className="mb-4">
                {t("sections.changesToPrivacyNotice.description1")}
              </p>
              <p>{t("sections.changesToPrivacyNotice.description2")}</p>
            </section>
          </div>

          {/* Bottom banner */}
          <ProductsBanner size="970x240" affiliateCompany="amazon" />

          {/* AdBanner */}
          <div className="flex justify-center gap-6">
            <AdBanner dataAdSlot="5459821520" uniqueId="adbanner-privacy-11" />
            <AdBanner
              dataAdSlot="5459821520"
              uniqueId="adbanner-privacy-12"
              className="hidden md:block"
            />
            <AdBanner
              dataAdSlot="5459821520"
              uniqueId="adbanner-privacy-13"
              className="hidden md:block"
            />
            <AdBanner
              dataAdSlot="5459821520"
              uniqueId="adbanner-privacy-14"
              className="hidden lg:block"
            />
          </div>
        </div>
      </ErrorBoundary>
    </main>
  );
}
