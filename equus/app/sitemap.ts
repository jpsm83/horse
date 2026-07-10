import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXTAUTH_URL || "https://equus.app";

const staticPublicRoutes = [
  { path: "", priority: 1.0 },
  { path: "/home", priority: 0.8 },
  { path: "/horses", priority: 0.8 },
  { path: "/stables", priority: 0.7 },
  { path: "/breeders", priority: 0.7 },
  { path: "/transport", priority: 0.7 },
  { path: "/trainers", priority: 0.7 },
  { path: "/groomers", priority: 0.7 },
  { path: "/riders", priority: 0.7 },
  { path: "/coaches", priority: 0.7 },
  { path: "/farriers", priority: 0.7 },
  { path: "/veterinaries", priority: 0.7 },
  { path: "/riding-clubs", priority: 0.7 },
  { path: "/workplaces", priority: 0.5 },
  { path: "/relationships", priority: 0.5 },
  { path: "/ownership-transfers", priority: 0.5 },
];

function buildUrl(route: string): string {
  return `${BASE_URL}${route}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  for (const route of staticPublicRoutes) {
    entries.push({
      url: buildUrl(route.path),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: route.priority,
    });
  }
  return entries;
}
