import { Metadata, Viewport } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { generatePublicMetadata } from "@/lib/utils/genericMetadata";
import { getUserRegion } from "@/app/actions/geolocation/getUserRegion";
import { RegionProvider } from "@/contexts/RegionContext";
import Navigation from "@/components/Navbar";
import Footer from "../../components/Footer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  // Base metadata for the locale - individual pages will override this with their own SEO data
  return {
    ...(await generatePublicMetadata(locale, "", "metadata.home.title")),
    metadataBase: new URL(process.env.NEXTAUTH_URL || process.env.VERCEL_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://womensspot.org'),
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Ensure that the incoming `locale` is valid
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Get messages for the current locale
  const messages = await getMessages();
  
  // Detect region once on server - shared across all pages in this locale
  const region = await getUserRegion();

  return (
    <NextIntlClientProvider messages={messages}>
      <RegionProvider initialRegion={region}>
        <main className="min-h-screen flex flex-col w-full max-w-full overflow-x-hidden">
          <Navigation />
          <div className="flex-1 flex flex-col pt-14 md:pt-16 w-full max-w-full overflow-x-hidden">{children}</div>
          <Footer />
        </main>
      </RegionProvider>
    </NextIntlClientProvider>
  );
}
