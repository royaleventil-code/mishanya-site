import type { MetadataRoute } from "next";
import { BAR_MITZVAH_COPY } from "@/data/bar-mitzvah";
import { BLOG_POSTS, hasBlogCopy } from "@/data/blog";
import { MUNICIPALITIES_COPY, BUSINESS_COPY } from "@/data/b2b";
import { CHARITY_PAGE_COPY } from "@/data/charity";
import { CITIES, hasCityCopy } from "@/data/cities";
import { HOLIDAYS, hasHolidayCopy } from "@/data/holidays";
import { PROGRAMS } from "@/data/programs";
import { SHOWS_PAGE_COPY } from "@/data/shows";
import { VENUES, hasVenueCopy } from "@/data/venues";
import { VIDEOS_PAGE_COPY } from "@/data/videos";
import { LOCALES, localePath, type Locale } from "@/lib/i18n";
import { hasProgramCopy } from "@/lib/localized-data";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-static";

const staticRoutes: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/all", priority: 0.95 },
  { path: "/faq", priority: 0.8 },
  { path: "/blog", priority: 0.8 },
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
    languages: {
      ...Object.fromEntries(
        LOCALES.map((locale) => [locale, localizedUrl(locale, path)]),
      ),
      "x-default": localizedUrl("ru", path),
    },
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const ageRoutes = Array.from({ length: 10 }, (_, index) => {
    const age = index + 1;
    return [
      { path: `/boy/${age}`, priority: 0.9 },
      { path: `/girl/${age}`, priority: 0.9 },
    ];
  }).flat();

  const baseEntries = LOCALES.flatMap((locale) =>
    [...staticRoutes, ...ageRoutes].map((route) => ({
      url: localizedUrl(locale, route.path),
      lastModified,
      changeFrequency: "weekly" as const,
      priority: route.priority,
      alternates: alternates(route.path),
    })),
  );

  // Страницы программ: HE-версии только у переведённых программ
  const programEntries = LOCALES.flatMap((locale) =>
    PROGRAMS.filter((program) => hasProgramCopy(locale, program.id)).map((program) => {
      const path = `/programs/${program.id}`;
      return {
        url: localizedUrl(locale, path),
        lastModified,
        changeFrequency: "weekly" as const,
        priority: 0.85,
        alternates: hasProgramCopy("he", program.id)
          ? alternates(path)
          : {
              languages: {
                ru: localizedUrl("ru", path),
                "x-default": localizedUrl("ru", path),
              },
            },
      };
    }),
  );

  const cityEntries = LOCALES.flatMap((locale) =>
    CITIES.filter((city) => hasCityCopy(locale, city.id)).map((city) => {
      const path = `/city/${city.id}`;
      return {
        url: localizedUrl(locale, path),
        lastModified,
        changeFrequency: "weekly" as const,
        priority: 0.9,
        // города без he-перевода: hreflang только на ru
        alternates: hasCityCopy("he", city.id)
          ? alternates(path)
          : {
              languages: {
                ru: localizedUrl("ru", path),
                "x-default": localizedUrl("ru", path),
              },
            },
      };
    }),
  );

  // Хелпер для страниц с гейтом по переводу: hreflang только на локали с контентом
  const gatedAlternates = (path: string, hasHe: boolean) =>
    hasHe
      ? alternates(path)
      : {
          languages: {
            ru: localizedUrl("ru", path),
            "x-default": localizedUrl("ru", path),
          },
        };

  const venueEntries = LOCALES.flatMap((locale) =>
    VENUES.filter((venue) => hasVenueCopy(locale, venue.id)).map((venue) => {
      const path = `/venue/${venue.id}`;
      return {
        url: localizedUrl(locale, path),
        lastModified,
        changeFrequency: "weekly" as const,
        priority: 0.85,
        alternates: gatedAlternates(path, hasVenueCopy("he", venue.id)),
      };
    }),
  );

  const holidayEntries = LOCALES.flatMap((locale) =>
    HOLIDAYS.filter((holiday) => hasHolidayCopy(locale, holiday.id)).map((holiday) => {
      const path = `/holiday/${holiday.id}`;
      return {
        url: localizedUrl(locale, path),
        lastModified,
        changeFrequency: "weekly" as const,
        priority: 0.85,
        alternates: gatedAlternates(path, hasHolidayCopy("he", holiday.id)),
      };
    }),
  );

  // Одиночные страницы с локализованным copy (B2B, видео, фонд, бар-мицва)
  const singlePages: { path: string; priority: number; hasCopy: (locale: Locale) => boolean }[] = [
    { path: "/municipalities", priority: 0.8, hasCopy: (l) => Boolean(MUNICIPALITIES_COPY[l].h1) },
    { path: "/shows", priority: 0.8, hasCopy: (l) => Boolean(SHOWS_PAGE_COPY[l].h1) },
    { path: "/business", priority: 0.8, hasCopy: (l) => Boolean(BUSINESS_COPY[l].h1) },
    { path: "/bar-mitzvah", priority: 0.75, hasCopy: (l) => Boolean(BAR_MITZVAH_COPY[l].h1) },
    { path: "/videos", priority: 0.7, hasCopy: (l) => Boolean(VIDEOS_PAGE_COPY[l].h1) },
    { path: "/charity", priority: 0.6, hasCopy: (l) => Boolean(CHARITY_PAGE_COPY[l].h1) },
  ];
  const singleEntries = LOCALES.flatMap((locale) =>
    singlePages
      .filter((page) => page.hasCopy(locale))
      .map((page) => ({
        url: localizedUrl(locale, page.path),
        lastModified,
        changeFrequency: "weekly" as const,
        priority: page.priority,
        alternates: gatedAlternates(page.path, page.hasCopy("he")),
      })),
  );

  // Статьи блога: строятся только локали с готовой копией (иврит после QA)
  const blogEntries = LOCALES.flatMap((locale) =>
    BLOG_POSTS.filter((post) => hasBlogCopy(locale, post.slug)).map((post) => {
      const path = `/blog/${post.slug}`;
      return {
        url: localizedUrl(locale, path),
        lastModified,
        changeFrequency: "weekly" as const,
        priority: 0.8,
        alternates: gatedAlternates(path, hasBlogCopy("he", post.slug)),
      };
    }),
  );

  return [
    ...baseEntries,
    ...programEntries,
    ...cityEntries,
    ...venueEntries,
    ...holidayEntries,
    ...singleEntries,
    ...blogEntries,
  ];
}
