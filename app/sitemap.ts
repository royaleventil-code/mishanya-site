import type { MetadataRoute } from "next";
import { LOCALES, localePath, type Locale } from "@/lib/i18n";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-static";

const staticRoutes: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/all", priority: 0.95 },
  { path: "/about", priority: 0.7 },
  { path: "/formats", priority: 0.7 },
  { path: "/gallery", priority: 0.65 },
  { path: "/contacts", priority: 0.65 },
  { path: "/accessibility", priority: 0.4 },
];

function localizedUrl(locale: Locale, path: string) {
  return siteUrl(localePath(locale, path));
}

function alternates(path: string) {
  return {
    languages: Object.fromEntries(
      LOCALES.map((locale) => [locale, localizedUrl(locale, path)]),
    ),
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-06-03");
  const ageRoutes = Array.from({ length: 10 }, (_, index) => {
    const age = index + 1;
    return [
      { path: `/boy/${age}`, priority: 0.9 },
      { path: `/girl/${age}`, priority: 0.9 },
    ];
  }).flat();

  return LOCALES.flatMap((locale) =>
    [...staticRoutes, ...ageRoutes].map((route) => ({
      url: localizedUrl(locale, route.path),
      lastModified,
      changeFrequency: "weekly" as const,
      priority: route.priority,
      alternates: alternates(route.path),
    })),
  );
}
