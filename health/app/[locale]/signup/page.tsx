import { Metadata } from "next";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";

import { generatePrivateMetadata } from "@/lib/utils/genericMetadata";
import { auth } from "@/app/api/v1/auth/[...nextauth]/auth";
import ErrorBoundary from "@/components/ErrorBoundary";
import SignUp from "@/components/SignUp";
import AdBanner from "@/components/adSence/AdBanner";

// Lazy load below-fold banners (they're not critical for initial render)
const ProductsBanner = dynamic(() => import("@/components/ProductsBanner"));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return generatePrivateMetadata(locale, "/signup", "metadata.signup.title");
}

export const revalidate = 0; // Auth page, no caching needed

export default async function SignUpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Server-side auth check - redirect if already authenticated
  const session = await auth();
  if (session?.user?.id) {
    if (session.user.role === "admin") {
      redirect(`/${locale}/dashboard`);
    } else {
      redirect(`/${locale}/profile`);
    }
  }

  return (
    <main className="container mx-auto my-8 md:my-16">
      <ErrorBoundary context={"Signup page"}>
        <div className="flex flex-col h-full gap-8 md:gap-16">
          {/* Products Banner */}
          <ProductsBanner size="970x90" affiliateCompany="amazon" />

          {/* AdBanner */}
          <AdBanner
            dataAdSlot="4003409246"
            uniqueId="adbanner-signup-1"
            className="hidden lg:block"
          />

          {/* Sign Up Section */}
          <section className="space-y-6 md:space-y-12">
            <SignUp locale={locale} />
          </section>

          {/* Bottom banner - lazy loaded */}
          <ProductsBanner size="970x240" affiliateCompany="amazon" />

          {/* AdBanner */}
          <div className="flex justify-center gap-6">
            <AdBanner dataAdSlot="5459821520" uniqueId="adbanner-signup-2" />
            <AdBanner
              dataAdSlot="5459821520"
              uniqueId="adbanner-signup-3"
              className="hidden md:block"
            />
            <AdBanner
              dataAdSlot="5459821520"
              uniqueId="adbanner-signup-4"
              className="hidden md:block"
            />
            <AdBanner
              dataAdSlot="5459821520"
              uniqueId="adbanner-signup-5"
              className="hidden lg:block"
            />
          </div>
        </div>
      </ErrorBoundary>
    </main>
  );
}
