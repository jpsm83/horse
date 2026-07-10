import { Metadata } from "next";
import dynamic from "next/dynamic";
import { getTranslations } from "next-intl/server";

import { generatePrivateMetadata } from "@/lib/utils/genericMetadata";
import ErrorBoundary from "@/components/ErrorBoundary";
import ConfirmNewsletterUI from "@/components/server/ConfirmNewsletterUI";
import confirmNewsletterSubscriptionAction, {
  NewsletterConfirmResult,
} from "@/app/actions/subscribers/confirmNewsletterSubscription";
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
    "/confirm-newsletter",
    "metadata.confirm-newsletter.title"
  );
}

export const revalidate = 3600;

export default async function ConfirmNewsletterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { locale } = await params;
  const { token, email } = await searchParams;
  const t = await getTranslations({
    locale,
    namespace: "newsletterConfirmation",
  });

  // Handle missing token or email
  let result: NewsletterConfirmResult;
  let initialStatus: "success" | "error" = "error";

  if (!token || !email) {
    result = {
      success: false,
      message: t("messages.missingParameters"),
      error: "MISSING_PARAMETERS",
    };
  } else {
    try {
      // Call server action to confirm subscription
      result = await confirmNewsletterSubscriptionAction(token, email);
      initialStatus = result.success ? "success" : "error";
    } catch (error) {
      console.error("Error confirming newsletter subscription:", error);
      result = {
        success: false,
        message: t("messages.unexpectedError"),
        error: "CONFIRMATION_FAILED",
      };
    }
  }

  return (
    <main className="container mx-auto my-8 md:my-16">
      <ErrorBoundary context={"ConfirmNewsletter component"}>
        <div className="flex flex-col h-full gap-8 md:gap-16">
          {/* Products Banner */}
          <ProductsBanner size="970x90" affiliateCompany="amazon" />

          {/* AdBanner */}
          <AdBanner
            dataAdSlot="4003409246"
            uniqueId="adbanner-confirmNewsletter-1"
            className="hidden lg:block"
          />

          {/* Confirm Newsletter Section */}
          <section className="space-y-6 md:space-y-12">
            <ConfirmNewsletterUI
              result={result}
              initialStatus={initialStatus}
              translations={{
                success: {
                  title: t("success.title"),
                  goHomeButton: t("success.goHomeButton"),
                },
                error: {
                  title: t("error.title"),
                  backToHomeButton: t("error.backToHomeButton"),
                },
                messages: {
                  missingParameters: t("messages.missingParameters"),
                  confirmationFailed: t("messages.confirmationFailed"),
                  unexpectedError: t("messages.unexpectedError"),
                },
              }}
            />
          </section>

          {/* Bottom banner - lazy loaded */}
          <ProductsBanner size="970x240" affiliateCompany="amazon" />

          {/* AdBanner */}
          <div className="flex justify-center gap-6">
            <AdBanner
              dataAdSlot="5459821520"
              uniqueId="adbanner-confirmNewsletter-2"
            />
            <AdBanner
              dataAdSlot="5459821520"
              uniqueId="adbanner-confirmNewsletter-3"
              className="hidden md:block"
            />
            <AdBanner
              dataAdSlot="5459821520"
              uniqueId="adbanner-confirmNewsletter-4"
              className="hidden md:block"
            />
            <AdBanner
              dataAdSlot="5459821520"
              uniqueId="adbanner-confirmNewsletter-5"
              className="hidden lg:block"
            />
          </div>
        </div>
      </ErrorBoundary>
    </main>
  );
}
