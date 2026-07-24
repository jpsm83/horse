import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/lib/seo/json-ld";
import { nonCssColors } from "@/lib/theme/nonCssColors";
import {
  THEME_COOKIE_NAME,
  normalizeTheme,
  themeHtmlClass,
} from "@/lib/theme/appTheme";
import { cn } from "@/lib/utils";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = process.env.NEXTAUTH_URL || "https://equus.app";

export const metadata: Metadata = {
  title: "Equus",
  description: "Equus horse management platform",
  metadataBase: new URL(BASE_URL),
  robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  openGraph: {
    type: "website",
    siteName: "Equus",
    title: "Equus — Horse & Equestrian Network",
    description: "Connect with horse owners, stables, breeders, and equestrian professionals.",
    url: BASE_URL,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Equus" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Equus — Horse & Equestrian Network",
    description: "Connect with horse owners, stables, breeders, and equestrian professionals.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  other: {
    "theme-color": nonCssColors.browserThemeColor,
    "msapplication-TileColor": nonCssColors.browserThemeColor,
    "format-detection": "telephone=no",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

type RootLayoutProps = { children: React.ReactNode };

export default async function RootLayout({ children }: RootLayoutProps) {
  const cookieStore = await cookies();
  const theme = normalizeTheme(cookieStore.get(THEME_COOKIE_NAME)?.value);

  return (
    <html
      className={cn(
        geistSans.variable,
        geistMono.variable,
        themeHtmlClass(theme),
        "h-full antialiased",
      )}
    >
      <body className="min-h-full flex flex-col">
        <OrganizationJsonLd />
        <WebSiteJsonLd />
        {children}
      </body>
    </html>
  );
}
