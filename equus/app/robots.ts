import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || "https://equus.app";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/", "/signin", "/signup", "/forgot-password",
          "/reset-password", "/confirm-email", "/resend-confirmation",
          "/profile", "/notifications", "/not-allowed",
          "/horses/new", "/stables/new",
          "/breeders/new", "/transport/new", "/trainers/new",
          "/groomers/new", "/riders/new", "/coaches/new",
          "/farriers/new", "/veterinaries/new", "/riding-clubs/new",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
