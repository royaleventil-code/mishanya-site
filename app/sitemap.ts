import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-static";

const staticRoutes = [
  { path: "/ru", priority: 1 },
  { path: "/ru/all", priority: 0.95 },
  { path: "/about", priority: 0.7 },
  { path: "/formats", priority: 0.7 },
  { path: "/gallery", priority: 0.65 },
  { path: "/contacts", priority: 0.65 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-06-03");
  const ageRoutes = Array.from({ length: 10 }, (_, index) => {
    const age = index + 1;
    return [
      { path: `/ru/boy/${age}`, priority: 0.9 },
      { path: `/ru/girl/${age}`, priority: 0.9 },
    ];
  }).flat();

  return [...staticRoutes, ...ageRoutes].map((route) => ({
    url: siteUrl(route.path),
    lastModified,
    changeFrequency: "weekly",
    priority: route.priority,
  }));
}
