import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import Script from "next/script";
import { Metadata, Viewport } from "next";
import { Suspense } from "react";
import SessionTracker from "@/components/SessionTracker";
import PerformanceMonitor from "@/components/PerformanceMonitor";
import AdSense from "@/components/adSence/AdSense";
import AdSenseRouter from "@/components/adSence/AdSenseRouter";

export const metadata: Metadata = {
  title: "Women's Spot - Your Comprehensive Health and Wellness Platform",
  description:
    "Discover a comprehensive health and wellness platform designed for women. Access valuable health insights, wellness tips, and expert advice on nutrition, fitness, mental health, and lifestyle.",
  keywords: [
    "health",
    "women",
    "wellness",
    "fitness",
    "nutrition",
    "mental health",
    "lifestyle",
  ],
  authors: [{ name: "Women's Spot Team" }],
  creator: "Women's Spot Team",
  publisher: "Women's Spot",
  metadataBase: new URL(
    process.env.NEXTAUTH_URL ||
      process.env.VERCEL_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://womensspot.org"
  ),
  robots:
    "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  openGraph: {
    type: "website",
    locale: "en_US",
    url:
      process.env.NEXTAUTH_URL ||
      process.env.VERCEL_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://womensspot.org",
    siteName: "Women's Spot",
    title: "Women's Spot - Your Comprehensive Health and Wellness Platform",
    description:
      "Discover a comprehensive health and wellness platform designed for women. Access valuable health insights, wellness tips, and expert advice on nutrition, fitness, mental health, and lifestyle.",
    images: [
      {
        url: "/womens-spot-logo.png",
        width: 630,
        height: 630,
        alt: "Women's Spot - Your Comprehensive Health and Wellness Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image", // Required: Card type
    site: "@womensspot", // Required: Website Twitter handle
    creator: "@womensspot", // Required: Content creator Twitter handle
    title: "Women's Spot - Your Comprehensive Health and Wellness Platform", // Required: Title (max 70 chars)
    description:
      "Discover a comprehensive health and wellness platform designed for women. Access valuable health insights and wellness tips.", // Required: Description (max 200 chars)
    images: ["/womens-spot-logo.png"], // Required: Image URLs
    // Note: image and imageAlt are handled via additional metadata
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/womens-spot-logo.png", sizes: "any", type: "image/png" },
    ],
    apple: [
      { url: "/womens-spot-logo.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Women's Spot",
  },
  other: {
    "msapplication-TileColor": "#8B5CF6",
    "theme-color": "#8B5CF6",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preconnect"
          href="https://res.cloudinary.com"
          crossOrigin=""
        />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link
          rel="preconnect"
          href="https://lh3.googleusercontent.com"
          crossOrigin=""
        />
        <link rel="dns-prefetch" href="https://lh3.googleusercontent.com" />
        <link
          rel="preconnect"
          href="https://images.unsplash.com"
          crossOrigin=""
        />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link
          rel="preconnect"
          href="https://pagead2.googlesyndication.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
        <link
          rel="preconnect"
          href="https://googleads.g.doubleclick.net"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://googleads.g.doubleclick.net" />

        {/* Pinterest Rich Pins Verification */}
        <meta
          name="p:domain_verify"
          content="93396404f1ccaaec8211f816a7deda73"
        />

        {/* Canonical link for page discovery - helps AdSense and search engines */}
        <link
          rel="canonical"
          href={
            process.env.NEXTAUTH_URL ||
            process.env.VERCEL_URL ||
            process.env.NEXT_PUBLIC_APP_URL ||
            "https://womensspot.org"
          }
        />

        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-06RKTZLN2X"
          strategy="afterInteractive"
        />

        {/* Google Analytics */}
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-06RKTZLN2X');
            `,
          }}
        />

        {/* Schema.org Structured Data */}
        <Script
          id="schema-org"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Women's Spot",
              url:
                process.env.NEXTAUTH_URL ||
                process.env.VERCEL_URL ||
                process.env.NEXT_PUBLIC_APP_URL ||
                "https://womensspot.org",
              logo: `${
                process.env.NEXTAUTH_URL ||
                process.env.VERCEL_URL ||
                process.env.NEXT_PUBLIC_APP_URL ||
                "https://womensspot.org"
              }/womens-spot-logo.png`,
              description:
                "Discover a comprehensive health and wellness platform designed for women. Access valuable health insights, wellness tips, and expert advice on nutrition, fitness, mental health, and lifestyle.",
              sameAs: ["https://twitter.com/womensspot"],
            }),
          }}
        />
        <Script
          id="schema-website"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Women's Spot",
              url:
                process.env.NEXTAUTH_URL ||
                process.env.VERCEL_URL ||
                process.env.NEXT_PUBLIC_APP_URL ||
                "https://womensspot.org",
              description:
                "Discover a comprehensive health and wellness platform designed for women. Access valuable health insights, wellness tips, and expert advice on nutrition, fitness, mental health, and lifestyle.",
              publisher: {
                "@type": "Organization",
                name: "Women's Spot",
              },
            }),
          }}
        />

        {/* Next.js will automatically inject metadata here */}
      </head>
      <body className="min-h-screen bg-[#f9fafb]">
        <SessionProvider basePath="/api/v1/auth">
          <SessionTracker />
          <PerformanceMonitor />
          <AdSense />
          <Suspense fallback={null}>
            <AdSenseRouter />
          </Suspense>
          {children}
          <Toaster />
        </SessionProvider>

        {/* CookieYes Banner (defer as much as possible)
        <Script
          id="cookieyes"
          src="https://cdn-cookieyes.com/client_data/51a7b20bfcdfbe3a78df8a60/script.js"
          strategy="lazyOnload"
        /> */}

        <Script
          id="sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js')
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
