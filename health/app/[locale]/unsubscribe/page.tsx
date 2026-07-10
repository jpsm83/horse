import { Metadata } from "next";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { getTranslations } from "next-intl/server";

import { generatePrivateMetadata } from "@/lib/utils/genericMetadata";
import ErrorBoundary from "@/components/ErrorBoundary";
import UnsubscribeUI from "@/components/server/UnsubscribeUI";
import unsubscribeFromNewsletterAction from "@/app/actions/subscribers/newsletterUnsubscribe";
import connectDb from "@/app/api/db/connectDb";
import User from "@/app/api/models/user";
import AdBanner from "@/components/adSence/AdBanner";

// Lazy load below-fold banners (they're not critical for initial render)
const ProductsBanner = dynamic(() => import("@/components/ProductsBanner"));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return generatePrivateMetadata(
    locale,
    "/unsubscribe",
    "metadata.unsubscribe.title"
  );
}

export const revalidate = 0; // Dynamic page with searchParams, no caching needed

export default async function UnsubscribePage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const searchParamsData = await searchParams;
  const t = await getTranslations({ locale, namespace: "unsubscribe" });

  // Get email and token from URL parameters
  const email = searchParamsData.email as string;
  const token = searchParamsData.token as string;

  // Process unsubscribe request if email is provided
  let result;
  let initialStatus: "success" | "error" | "no-email" = "no-email";

  if (email) {
    try {
      result = await unsubscribeFromNewsletterAction(email, token);
      initialStatus = result.success ? "success" : "error";
    } catch (error) {
      console.error("Unsubscribe error:", error);
      result = {
        success: false,
        message: "Something went wrong. Please try again.",
      };
      initialStatus = "error";
    }

    // Check if user has account AFTER processing unsubscribe
    let hasUserAccount = false;
    try {
      await connectDb();
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      hasUserAccount = !!existingUser;
    } catch (error) {
      console.error("Error checking for user account:", error);
      // Continue with showing result if there's an error checking user accounts
    }

    // If user has account and unsubscribe was successful, redirect to profile
    if (hasUserAccount && result.success) {
      redirect(`/${locale}/profile`);
    }
  }

  return (
    <main className="container mx-auto my-8 md:my-16">
      <ErrorBoundary context={"Unsubscribe page"}>
        <div className="flex flex-col h-full gap-8 md:gap-16">
          {/* Products Banner */}
          <ProductsBanner size="970x90" affiliateCompany="amazon" />

          {/* AdBanner */}
          <AdBanner
            dataAdSlot="4003409246"
            uniqueId="adbanner-unsubscribe-1"
            className="hidden lg:block"
          />

          {/* Unsubscribe Section */}
          <section className="space-y-6 md:space-y-12">
            <UnsubscribeUI
              result={result}
              hasEmail={!!email}
              initialStatus={initialStatus}
              translations={{
                title: t("title"),
                description: t("description"),
                successTitle: t("successTitle"),
                successMessage: t("successMessage"),
                errorTitle: t("errorTitle"),
                errorMessage: t("errorMessage"),
                invalidLinkTitle: t("invalidLinkTitle"),
                invalidLinkMessage: t("invalidLinkMessage"),
              }}
            />
          </section>

          {/* Bottom banner - lazy loaded */}
          <ProductsBanner size="970x240" affiliateCompany="amazon" />

          {/* AdBanner */}
          <div className="flex justify-center gap-6">
            <AdBanner
              dataAdSlot="5459821520"
              uniqueId="adbanner-unsubscribe-2"
            />
            <AdBanner
              dataAdSlot="5459821520"
              uniqueId="adbanner-unsubscribe-3"
              className="hidden md:block"
            />
            <AdBanner
              dataAdSlot="5459821520"
              uniqueId="adbanner-unsubscribe-4"
              className="hidden md:block"
            />
            <AdBanner
              dataAdSlot="5459821520"
              uniqueId="adbanner-unsubscribe-5"
              className="hidden lg:block"
            />
          </div>
        </div>
      </ErrorBoundary>
    </main>
  );
}
