### Task 6: Update `app/layout.tsx` — full root metadata + JSON-LD + viewport

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Rewrite root layout with full metadata**

Replace the content of `app/layout.tsx` with:

```tsx
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/lib/seo/json-ld.tsx";

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
    "theme-color": "#8B5CF6",
    "msapplication-TileColor": "#8B5CF6",
    "format-detection": "telephone=no",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

type RootLayoutProps = { children: React.ReactNode };

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <OrganizationJsonLd />
        <WebSiteJsonLd />
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Run typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat(seo): add full root metadata, viewport, and JSON-LD"
```
